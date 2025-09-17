import React, { Suspense, forwardRef, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

useGLTF.preload('/models/NewVisicooler2.glb');


export const Experience = forwardRef(({ lighting = 'photo_studio_01_1k.hdr', position = [0, -0.8, 0], scale = 1.0, onAssetLoaded, doorAxis = 'x', glowColor = '#fff700', insideStripTexture = null, fridgeColor = '#ffffff', handleColor = '#ffffff', sidePanelLeftTexture = null, sidePanelRightTexture = null, pepsiTexture = null, debugUV = false }, ref) => {
  const { scene: threeScene, camera, gl } = useThree();
  const { scene: originalScene } = useGLTF('/models/NewVisicooler2.glb');
  // clone to avoid reuse issues
  const [scene] = React.useState(() => originalScene ? originalScene.clone(true) : null);

  // --- FridgeColor Material Color Update (by material name) ---
  useEffect(() => {
    if (!scene) return;
    scene.traverse((obj) => {
      if (obj.isMesh) {
        const mat = obj.material;
        if (mat) {
          if (mat.name && mat.name.toLowerCase() === 'fridgecolor') {
            if (mat.color) {
              mat.color.set(fridgeColor);
              mat.needsUpdate = true;
            }
          }
        }
      }
    });
  }, [scene, fridgeColor]);

  // --- HandleColor Material Color Update (by material name) ---
  useEffect(() => {
    if (!scene) return;
    let found = false;
    scene.traverse((obj) => {
      if (obj.isMesh) {
        const mat = obj.material;
        if (mat && mat.name && typeof mat.name === 'string') {
          // Compare with all possible casing and trim whitespace
          const matName = mat.name.trim().toLowerCase();
          if (matName === 'handlecolor') {
            if (mat.color) {
              mat.color.set(handleColor);
              mat.needsUpdate = true;
              found = true;
            }
          }
        }
      }
    });
    if (!found) {
      console.warn('⚠️ No material named "HandleColor" found on any mesh');
    }
  }, [scene, handleColor]);

  // --- InsideStrip Texture Update ---
  // --- Debug: Log all mesh names ---
// removed debug mesh-name logging


  // --- Glow Material Color Update ---
  useEffect(() => {
    if (!scene) return;
    scene.traverse((obj) => {
      if (obj.isMesh && obj.material && obj.material.name && obj.material.name.toLowerCase().includes('glow')) {
        if (obj.material.emissive && obj.material.color) {
          obj.material.emissive.set(glowColor);
          obj.material.color.set(glowColor); // Set base color to match emissive for full color glow
          obj.material.emissiveIntensity = 15.0; // strong tube effect
          obj.material.needsUpdate = true;
        }
      }
    });
  }, [scene, glowColor]);


  const sceneRef = useRef();
  const doorRef = useRef();
  const glassRef = useRef();
  const doorInitialRotationRef = useRef(0);
  const glassInitialRotationRef = useRef(0);
  const isDoorOpen = useRef(false);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // LED toggle state (default OFF)
  const [ledOn, setLedOn] = React.useState(false);

  // --- Door-only mesh logger ---
  // Traverse the Door object (if present) and log all child mesh names so the user can identify the exact mesh to target
  useEffect(() => {
    if (!scene) return;
    const door = scene.getObjectByName('Door') || scene.getObjectByName('door');
    if (!door) {
      console.warn('No Door object found in scene to inspect.');
      return;
    }
    // door mesh listing removed (debug)
  }, [scene]);

  // --- Door UV inspector and optional visual checker ---
  useEffect(() => {
    if (!scene) return;
    const door = scene.getObjectByName('Door') || scene.getObjectByName('door');
    if (!door) return;

  // Door UV inspection (logs removed)
    const meshesWithUV = [];
    door.traverse((child) => {
      if (child.isMesh) {
        const geom = child.geometry;
        const hasUV = !!(geom && geom.attributes && (geom.attributes.uv || geom.attributes.uv2));
  const uvAttr = geom && geom.attributes ? (geom.attributes.uv || geom.attributes.uv2) : null;
  const uvCount = uvAttr ? uvAttr.count : 0;
        if (hasUV) meshesWithUV.push(child);
      }
    });
  // end UV inspection

    // If debugUV is true, apply a reversible checker texture to meshes that have UVs so user can visually confirm mapping
    if (debugUV && meshesWithUV.length > 0) {
      // create a small checker canvas texture
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const checker = (x, y, s) => ((x + y) % 2 === 0) ? '#ffffff' : '#444444';
      const cell = 32;
      for (let y = 0; y < size; y += cell) {
        for (let x = 0; x < size; x += cell) {
          ctx.fillStyle = checker(Math.floor(x / cell), Math.floor(y / cell));
          ctx.fillRect(x, y, cell, cell);
        }
      }
      const checkerTex = new THREE.CanvasTexture(canvas);
      checkerTex.encoding = THREE.sRGBEncoding;
      checkerTex.wrapS = checkerTex.wrapT = THREE.RepeatWrapping;
      checkerTex.repeat.set(1, 1);

      // store original maps to restore on cleanup
      const originalMaps = new Map();
      meshesWithUV.forEach((m) => {
        if (!m.material) m.material = new THREE.MeshStandardMaterial();
        originalMaps.set(m.uuid, m.material.map || null);
        if (m.material.map && m.material.map.dispose) m.material.map.dispose();
        m.material.map = checkerTex;
        m.material.needsUpdate = true;
      });

      return () => {
        // restore original maps
        meshesWithUV.forEach((m) => {
          const orig = originalMaps.get(m.uuid) || null;
          if (m.material) {
            if (m.material.map && m.material.map.dispose && m.material.map !== orig) {
              m.material.map.dispose();
            }
            m.material.map = orig;
            m.material.needsUpdate = true;
          }
        });
        // dispose checker texture
        if (checkerTex) checkerTex.dispose();
      };
    }
    // no cleanup needed if debugUV not enabled
    return undefined;
  }, [scene, debugUV]);

  // --- Apply uploaded pepsiTexture to Door Cylinder001 meshes ---
  useEffect(() => {
    if (!scene) return;
    const door = scene.getObjectByName('Door') || scene.getObjectByName('door');
    if (!door) return;

    // Helper to match exactly Cylinder001 or Cylinder.001 (no wildcard)
    const isCylinder001 = (name) => {
      if (!name) return false;
      const lower = name.toLowerCase();
      return lower === 'cylinder001' || lower === 'cylinder.001';
    };

    // If no pepsiTexture, remove maps applied earlier (restore emissiveMap to null)
    if (!pepsiTexture) {
      door.traverse((child) => {
        if (child.isMesh && isCylinder001(child.name)) {
          if (child.material) {
            if (child.material.map && child.material.map.dispose) {
              child.material.map.dispose();
            }
            child.material.map = null;
            child.material.emissiveMap = null;
            child.material.emissive = new THREE.Color(0x000000);
            child.material.emissiveIntensity = 0;
            // restore default side
            child.material.side = THREE.FrontSide;
            child.material.needsUpdate = true;
          }
        }
      });
      return;
    }

    // Load and apply the texture to matching meshes
    const loader = new THREE.TextureLoader();
    try {
      loader.load(pepsiTexture, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false;
        tex.needsUpdate = true;

        door.traverse((child) => {
          if (child.isMesh && isCylinder001(child.name)) {
            if (!child.material) child.material = new THREE.MeshStandardMaterial();
            // dispose previous map if any
            if (child.material.map && child.material.map.dispose) child.material.map.dispose();

            // adjust texture orientation: force a mirror horizontally (flip around Y axis)
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            // ensure offset/center/rotation are explicit and keep repeat positive (no mirror)
            tex.center.set(0.5, 0.5);
            tex.offset.set(0, 0);
            tex.rotation = 0;
             tex.repeat.set(2,1.01);
            tex.needsUpdate = true;

            child.material.map = tex;
            child.material.emissiveMap = tex;
            child.material.emissive = new THREE.Color(0xffffff);
            child.material.emissiveIntensity = 1;
            // ensure both sides show (handles inverted normals)
            child.material.side = THREE.DoubleSide;
            child.material.needsUpdate = true;
          }
        });
      });
    } catch (e) {
      console.warn('Failed to apply pepsiTexture to Door Cylinder meshes', e);
    }
    // No explicit cleanup here; textures are disposed when removed or on unmount by other effects
  }, [scene, pepsiTexture]);

  // --- Logo glow animation for Cylinder001 when pepsiTexture is present ---
  useEffect(() => {
    if (!scene) return;
    const door = scene.getObjectByName('Door') || scene.getObjectByName('door');
    if (!door) return;

    // find the Cylinder001 mesh(s)
    const targets = [];
    door.traverse((child) => {
      if (child.isMesh && child.name) {
        const lower = child.name.toLowerCase();
        if (lower === 'cylinder001' || lower === 'cylinder.001') {
          targets.push(child);
        }
      }
    });

    if (targets.length === 0) return;

    // create a GSAP timeline that 'blinks' the logo:
    // quick ramp-up -> short hold -> quick ramp-down -> 2s pause -> repeat
    const timelines = [];
    targets.forEach((mesh) => {
      const mat = mesh.material;
      if (!mat) return;
      if (typeof mat.emissiveIntensity !== 'number') mat.emissiveIntensity = 0;

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0 });
      // initial ensure off
      tl.set(mat, { emissiveIntensity: 0 });
      // blink on quickly (120ms)
      tl.to(mat, { emissiveIntensity: Math.max(mat.emissiveIntensity || 2.5, 2.5), duration: 0.12, ease: 'power2.out', onUpdate: () => mat && (mat.needsUpdate = true) });
      // hold briefly (100ms)
      tl.to(mat, { emissiveIntensity: Math.max(mat.emissiveIntensity || 2.5, 2.5), duration: 0.1, onUpdate: () => mat && (mat.needsUpdate = true) });
      // blink off quickly (120ms)
      tl.to(mat, { emissiveIntensity: 0, duration: 0.12, ease: 'power2.in', onUpdate: () => mat && (mat.needsUpdate = true) });
      // wait 2s before next blink
      tl.to({}, { duration: 2.0 });

      timelines.push(tl);
    });

    // cleanup
    return () => {
      timelines.forEach(t => t.kill && t.kill());
      targets.forEach((mesh) => {
        const mat = mesh.material;
        if (mat) {
          if (!pepsiTexture) {
            mat.emissiveIntensity = 0;
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveMap = null;
            mat.side = THREE.FrontSide;
          }
          mat.needsUpdate = true;
        }
      });
    };
  }, [scene, pepsiTexture]);

  // Find and store the Point light, and handle Insidestrip glow effect
  const pointLightRef = useRef(null);
  useEffect(() => {
    if (!scene) return;
    pointLightRef.current = scene.getObjectByName('Point');
    if (pointLightRef.current) {
      pointLightRef.current.visible = ledOn;
      pointLightRef.current.intensity = 1.5;
    }

    // Glow effect for Insidestrip1...6 using uploaded image as emissiveMap if available
    scene.traverse((obj) => {
      if (obj.isMesh && obj.name) {
        const lower = obj.name.toLowerCase();
        for (let i = 1; i <= 6; i++) {
          if (lower === `insidestrip${i}` && obj.material) {
            if (ledOn && obj.material.map) {
              // Use the uploaded image as the emissiveMap for glow
              obj.material.emissive = new THREE.Color(0xffffff);
              obj.material.emissiveIntensity = 1.5;
              obj.material.emissiveMap = obj.material.map;
            } else {
              // Remove glow
              obj.material.emissive = new THREE.Color(0x000000);
              obj.material.emissiveIntensity = 0;
              obj.material.emissiveMap = null;
            }
            obj.material.needsUpdate = true;
          }
        }
      }
    });
  }, [scene, ledOn]);

  // expose API
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === 'function') return;
    ref.current = {
      setPosition: (pos) => {
        if (!sceneRef.current) return;
        if (Array.isArray(pos) && pos.length >= 3) {
          sceneRef.current.position.set(pos[0], pos[1], pos[2]);
        } else if (pos && typeof pos.x === 'number') {
          sceneRef.current.position.set(pos.x, pos.y, pos.z);
        } else {
          console.warn('setPosition expects [x,y,z] or {x,y,z} or THREE.Vector3', pos);
          return;
        }
        console.info('NewVisicooler setPosition ->', sceneRef.current.position.toArray());
      },
      setScale: (s) => {
        if (!sceneRef.current) return;
        const val = typeof s === 'number' ? s : (s && s.x) || 1;
        sceneRef.current.scale.set(val, val, val);
        console.info('NewVisicooler setScale ->', val);
      },
      toggleLED: (on) => setLedOn(!!on)
    };
  }, [ref]);

  // remove embedded lights, set initial transform and refs
  useEffect(() => {
    if (!scene) return;

    // Remove all embedded lights except the 'Point' light
    const toRemove = [];
    scene.traverse((obj) => {
      if (!obj) return;
      if (obj.isLight && obj.name !== 'Point') {
        toRemove.push(obj);
      }
    });
    toRemove.forEach(l => { if (l.parent) l.parent.remove(l); });

  // store refs to door/glass if present and record their initial rotations
    doorRef.current = scene.getObjectByName('Door') || scene.getObjectByName('door') || null;
    glassRef.current = scene.getObjectByName('Glass') || scene.getObjectByName('glass') || null;
    if (doorRef.current) {
      doorInitialRotationRef.current = typeof doorRef.current.rotation?.z === 'number' ? doorRef.current.rotation.z : 0;
    }
    if (glassRef.current) {
      glassInitialRotationRef.current = typeof glassRef.current.rotation?.z === 'number' ? glassRef.current.rotation.z : 0;
    }

    // shadows
    scene.traverse(c => { if (c.isMesh && c.name !== 'Door') { c.castShadow = true; c.receiveShadow = true; } });

    // Apply initial transform
if (!scene || !threeScene) return;
    threeScene.background = null;
    scene.scale.set(2, 2, 2);
    scene.position.set(0.2, -1.5, 0);

  // notify parent
    if (onAssetLoaded) onAssetLoaded();

    // cleanup will be handled in separate effect
  }, [scene, position, scale, onAssetLoaded]);

  // click handling to toggle door
  useEffect(() => {
    if (!scene || !camera || !gl) return;

   const handleClick = (event) => {
    console.debug('[NewVisi] canvas click', { clientX: event.clientX, clientY: event.clientY });
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, camera);

  const intersectsDoor = doorRef.current ? raycaster.current.intersectObject(doorRef.current, true) : [];
  console.debug('[NewVisi] intersectsDoor count ->', intersectsDoor.length);

  if (intersectsDoor.length > 0) {
        // rotate the Door object only (Door is assumed to contain glass) using quaternion
        const axisStr = (typeof doorAxis === 'string' ? doorAxis.toLowerCase() : 'x');
        const axis = axisStr === 'x' ? new THREE.Vector3(1, 0, 0) : axisStr === 'y' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
        const angle = Math.PI / 2; // 90deg
        const rot = new THREE.Quaternion().setFromAxisAngle(axis, isDoorOpen.current ? -angle : angle);

        if (doorRef.current) {
          const start = doorRef.current.quaternion.clone();
          const end = start.clone().multiply(rot);
          gsap.to(doorRef.current.quaternion, {
            x: end.x,
            y: end.y,
            z: end.z,
            w: end.w,
            duration: 1,
            ease: 'power2.inOut',
            onUpdate: () => doorRef.current.quaternion.normalize()
          });
        }

        isDoorOpen.current = !isDoorOpen.current;
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => gl.domElement.removeEventListener('click', handleClick);
  }, [scene, camera, gl]);

  useEffect(() => {
    if (gl && gl.toneMappingExposure !== undefined) gl.toneMappingExposure = 1;
  }, [gl]);



  // Apply uploaded texture to Insidestrip1...6 meshes
  useEffect(() => {
    if (!scene) return;
    if (!insideStripTexture) {
      // Remove texture from InsideStrip meshes, do not restore any material
      scene.traverse((obj) => {
        if (obj.isMesh && obj.name) {
          const lower = obj.name.toLowerCase();
          for (let i = 1; i <= 6; i++) {
            if (lower === `insidestrip${i}` && obj.material) {
              if (obj.material.map && obj.material.map.dispose) {
                obj.material.map.dispose();
              }
              obj.material.map = null;
              obj.material.needsUpdate = true;
            }
          }
        }
      });
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const texture = new THREE.Texture(img);
      // Restore original mapping for InsideStrip (no setUserTextureParams)
      texture.encoding = THREE.sRGBEncoding;
      texture.flipY = false;
      texture.needsUpdate = true;
      let found = false;
      scene.traverse((obj) => {
        if (obj.isMesh && obj.name) {
          const lower = obj.name.toLowerCase();
          for (let i = 1; i <= 6; i++) {
            if (lower === `insidestrip${i}`) {
              if (!obj.material) {
                obj.material = new THREE.MeshStandardMaterial();
              }
              if (obj.material.map && obj.material.map.dispose) {
                obj.material.map.dispose();
              }
              obj.material.map = texture;
              obj.material.needsUpdate = true;
              if (obj.material.map) obj.material.map.needsUpdate = true;
              found = true;
            }
          }
        }
      });
      if (!found) {
        console.warn('⚠️ No Insidestrip1...6 mesh found for replacement');
      }
    };
    img.onerror = (err) => {
      console.error('❌ Failed to load InsideStrip image', err);
    };
    img.src = insideStripTexture;
  }, [scene, insideStripTexture, gl]);

  // --- SidepannelLeft Texture Update ---
  useEffect(() => {
    if (!scene) return;
    if (!sidePanelLeftTexture) {
      // Restore FridgeColor material if texture is removed
      scene.traverse((obj) => {
        if (obj.isMesh && obj.name && obj.name.toLowerCase() === 'sidepannelleft') {
          obj.material = new THREE.MeshStandardMaterial();
          obj.material.name = 'FridgeColor';
          obj.material.color = new THREE.Color(fridgeColor || '#ffffff');
          obj.material.needsUpdate = true;
        }
      });
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const texture = new THREE.Texture(img);
      texture.encoding = THREE.sRGBEncoding;
      texture.anisotropy = 16;
      texture.flipY = false;
       texture.center.set(0, 0.5);
        texture.repeat.set(3,0.9);
      texture.needsUpdate = true;
      let found = false;
      scene.traverse((obj) => {
        if (obj.isMesh && obj.name && obj.name.toLowerCase() === 'sidepannelleft') {
          // Remove FridgeColor material if present
          if (obj.material && obj.material.name && obj.material.name.toLowerCase() === 'fridgecolor') {
            obj.material = new THREE.MeshStandardMaterial();
          }
          // Clone material if not already unique
          if (obj.material && !obj.material._isClonedForSidePanelLeft) {
            obj.material = obj.material.clone();
            obj.material._isClonedForSidePanelLeft = true;
          } else if (!obj.material) {
            obj.material = new THREE.MeshStandardMaterial();
            obj.material._isClonedForSidePanelLeft = true;
          }
          if (obj.material.map && obj.material.map.dispose) {
            obj.material.map.dispose();
          }
          obj.material.map = texture;
          obj.material.needsUpdate = true;
          if (obj.material.map) obj.material.map.needsUpdate = true;
          found = true;
        }
      });
      if (!found) {
        console.warn('⚠️ No SidepannelLeft mesh found for replacement');
      }
    };
    img.onerror = (err) => {
      console.error('❌ Failed to load SidepannelLeft image', err);
    };
    img.src = sidePanelLeftTexture;
  }, [scene, sidePanelLeftTexture, gl, fridgeColor]);

  // --- SidepannelRight Texture Update ---
  useEffect(() => {
    if (!scene) return;
    if (!sidePanelRightTexture) {
      // Restore FridgeColor material if texture is removed
      scene.traverse((obj) => {
        if (obj.isMesh && obj.name && obj.name.toLowerCase() === 'sidepannelright') {
          obj.material = new THREE.MeshStandardMaterial();
          obj.material.name = 'FridgeColor';
          obj.material.color = new THREE.Color(fridgeColor || '#ffffff');
          obj.material.needsUpdate = true;
        }
      });
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const texture = new THREE.Texture(img);
      texture.encoding = THREE.sRGBEncoding;
      texture.anisotropy = 16;
      texture.flipY = false;
      texture.center.set(0, 0.5);
        texture.repeat.set(3,0.9);
      texture.needsUpdate = true;
      let found = false;
      scene.traverse((obj) => {
        if (obj.isMesh && obj.name && obj.name.toLowerCase() === 'sidepannelright') {
          // Remove FridgeColor material if present
          if (obj.material && obj.material.name && obj.material.name.toLowerCase() === 'fridgecolor') {
            obj.material = new THREE.MeshStandardMaterial();
          }
          // Clone material if not already unique
          if (obj.material && !obj.material._isClonedForSidePanelRight) {
            obj.material = obj.material.clone();
            obj.material._isClonedForSidePanelRight = true;
          } else if (!obj.material) {
            obj.material = new THREE.MeshStandardMaterial();
            obj.material._isClonedForSidePanelRight = true;
          }
          if (obj.material.map && obj.material.map.dispose) {
            obj.material.map.dispose();
          }
          obj.material.map = texture;
          obj.material.needsUpdate = true;
          if (obj.material.map) obj.material.map.needsUpdate = true;
          found = true;
        }
      });
      if (!found) {
        console.warn('⚠️ No SidepannelRight mesh found for replacement');
      }
    };
    img.onerror = (err) => {
      console.error('❌ Failed to load SidepannelRight image', err);
    };
    img.src = sidePanelRightTexture;
  }, [scene, sidePanelRightTexture, gl, fridgeColor]);

  // cleanup textures/geometries when unmounting
  useEffect(() => {
    return () => {
      if (!sceneRef.current) return;
      sceneRef.current.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => { if (m.dispose) m.dispose(); });
            else if (child.material.dispose) child.material.dispose();
          }
        }
      });
    };
  }, [sceneRef]);

  return (
    <>
      <Suspense fallback={null}>
        <Environment files={lighting} background={false} intensity={2.0} />
        <ContactShadows position={[0, -1.66, 0]} opacity={0.9} scale={15} far={25} resolution={512} />
        <OrbitControls enableDamping dampingFactor={0.12} rotateSpeed={1.1} zoomSpeed={1.0} panSpeed={0.8} enablePan minDistance={0} maxDistance={20} minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 2.05} target={[0, 0.5, 0]} makeDefault />
        {scene && <primitive object={scene} />}
      </Suspense>
    </>
  );
});
