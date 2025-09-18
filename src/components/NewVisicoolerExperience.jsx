import React, { Suspense, forwardRef, useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

useGLTF.preload('/models/NewVisicooler3.glb');

export const Experience = forwardRef(({
  lighting = 'photo_studio_01_1k.hdr',
  position = [0, -0.8, 0],
  scale = 1.0,
  onAssetLoaded,
  doorAxis = 'x',
  glowColor = '#fff700',
  insideStripTexture = null,
  fridgeColor = '#ffffff',
  handleColor = '#ffffff',
  sidePanelLeftTexture = null,
  sidePanelRightTexture = null,
  pepsiTexture = null,
  debugUV = false
}, ref) => {
  const { scene: threeScene, camera, gl } = useThree();
  const { scene: originalScene } = useGLTF('/models/NewVisicooler3.glb');
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

  // --- Glow Material Color Update (for generic glow materials) ---
  useEffect(() => {
    if (!scene) return;
    scene.traverse((obj) => {
      if (obj.isMesh && obj.material && obj.material.name && obj.material.name.toLowerCase().includes('glow')) {
        if (obj.material.emissive && obj.material.color) {
          obj.material.emissive.set(glowColor);
          obj.material.color.set(glowColor); // Set base color to match emissive for tube look
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
  const [ledOn, setLedOn] = useState(false);

  // --- Door-only mesh logger ---
  useEffect(() => {
    if (!scene) return;
    const door = scene.getObjectByName('Door') || scene.getObjectByName('door');
    if (!door) {
      console.warn('No Door object found in scene to inspect.');
      return;
    }
    // debug logging removed
  }, [scene]);

  // --- Door UV inspector and optional visual checker ---
  useEffect(() => {
    if (!scene) return;
    const door = scene.getObjectByName('Door') || scene.getObjectByName('door');
    if (!door) return;

    const meshesWithUV = [];
    door.traverse((child) => {
      if (child.isMesh) {
        const geom = child.geometry;
        const hasUV = !!(geom && geom.attributes && (geom.attributes.uv || geom.attributes.uv2));
        if (hasUV) meshesWithUV.push(child);
      }
    });

    if (debugUV && meshesWithUV.length > 0) {
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
      // backwards-compatible encoding set
      if ('colorSpace' in checkerTex) checkerTex.colorSpace = THREE.SRGBColorSpace;
      else checkerTex.encoding = THREE.sRGBEncoding;
      checkerTex.wrapS = checkerTex.wrapT = THREE.RepeatWrapping;
      checkerTex.repeat.set(1, 1);

      const originalMaps = new Map();
      meshesWithUV.forEach((m) => {
        if (!m.material) m.material = new THREE.MeshStandardMaterial();
        originalMaps.set(m.uuid, m.material.map || null);
        if (m.material.map && m.material.map.dispose) m.material.map.dispose();
        m.material.map = checkerTex;
        m.material.needsUpdate = true;
      });

      return () => {
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
        if (checkerTex) checkerTex.dispose();
      };
    }
    return undefined;
  }, [scene, debugUV]);

  // --- Apply uploaded pepsiTexture to Door Cylinder001 meshes (base map only) ---
  // We'll avoid using the same texture for emissiveMap; emissive will be animated separately.
  useEffect(() => {
    if (!scene) return;
    const door = scene.getObjectByName('Door') || scene.getObjectByName('door');
    if (!door) return;

    // Helper to match exactly Cylinder001 or Cylinder.001 (no wildcard)
    const isCylinder001 = (name) => {
      if (!name) return false;
      const lower = name.toLowerCase();
      return lower === 'cylinder002' || lower === 'cylinder.002';
    };

    // Track created texture(s) so we can dispose on cleanup
    let createdTexture = null;

    // If no pepsiTexture, remove maps applied earlier (restore emissiveMap to null)
    if (!pepsiTexture) {
      door.traverse((child) => {
        if (child.isMesh && isCylinder001(child.name)) {
          if (child.material) {
            if (child.material.map && child.material.map.dispose) {
              child.material.map.dispose();
            }
            child.material.map = null;
            // keep emissive clean (no emissiveMap)
            child.material.emissiveMap = null;
            child.material.emissive = new THREE.Color(0x000000);
            child.material.emissiveIntensity = 0;
            child.material.side = THREE.FrontSide;
            child.material.needsUpdate = true;
          }
        }
      });
      return undefined;
    }

    // Load and apply the texture to matching meshes (base map only)
    const loader = new THREE.TextureLoader();
    let cancelled = false;
    try {
      loader.load(pepsiTexture, (tex) => {
        if (cancelled) {
          if (tex && tex.dispose) tex.dispose();
          return;
        }

        // Support older/newer three.js naming:
        if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
        else tex.encoding = THREE.sRGBEncoding;
        tex.flipY = false;
  tex.anisotropy = 16;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.center.set(0.5, 0.5);
        tex.offset.set(0, 0);
        tex.rotation = 0;
        tex.repeat.set(2, 1.01);
        tex.needsUpdate = true;

        // store for cleanup
        createdTexture = tex;

        door.traverse((child) => {
          if (child.isMesh && isCylinder001(child.name)) {
            if (!child.material) child.material = new THREE.MeshStandardMaterial();

            // dispose previous map if any
            if (child.material.map && child.material.map.dispose) child.material.map.dispose();

            // Apply Pepsi image as base map ONLY
            child.material.map = tex;

            // Use the same texture as emissiveMap so the logo glows in its own colors.
            // Keep intensity low and animate emissiveIntensity to brighten without washing.
            child.material.emissiveMap = tex;
            // Choose emissive color white so emissiveMap colors are shown unmodified
            child.material.emissive = new THREE.Color(0xffffff);
            // Reduce specular highlight to avoid 'washed' look but keep it slightly visible
            child.material.metalness = 0.0;
            child.material.roughness = 0.4;
            child.material.emissiveIntensity = 0; // start with no glow
            child.material.side = THREE.DoubleSide;
            child.material.needsUpdate = true;
          }
        });
      });
    } catch (e) {
      console.warn('Failed to apply pepsiTexture to Door Cylinder meshes', e);
    }

    // cleanup when pepsiTexture changes or component unmounts
    return () => {
      cancelled = true;
      if (createdTexture && createdTexture.dispose) {
        // IMPORTANT: don't dispose if that texture is being used by other meshes that still need it;
        // in this small scope we created and assigned it only to Cylinder meshes above,
        // so safe to dispose here.
        createdTexture.dispose();
      }
    };
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

    // if no pepsiTexture, ensure logo is not glowing and exit early
    if (!pepsiTexture) {
      targets.forEach((mesh) => {
        const m = mesh.material;
        if (m) {
          m.emissiveIntensity = 0;
          m.emissive = new THREE.Color(0x000000);
          m.emissiveMap = null;
          m.side = THREE.FrontSide;
          m.needsUpdate = true;
        }
      });
      return undefined;
    }

    // create timelines that animate emissiveIntensity (pulse) for each mesh
    const tls = [];
    targets.forEach((mesh, idx) => {
      const mat = mesh.material;
      if (!mat) return;

      // ensure emissive color exists and starts at 0 intensity
  if (!mat.emissive) mat.emissive = new THREE.Color(0xffffff);
  // you may change this color if you want a different glow
  mat.emissive.set(0xffffff);
      mat.emissiveIntensity = 0;
      mat.emissiveMap = null; // ensure no emissiveMap reuse
      mat.needsUpdate = true;

      // create timeline for this mesh
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0, delay: idx * 0.12 });
      // pulse from 0 -> peak -> 0, then hold a little
      tl.to(mat, {
        emissiveIntensity: 1.5, // increased peak for a stronger visible glow
        duration: 0.9,
        ease: 'sine.inOut',
        onUpdate: () => mat && (mat.needsUpdate = true)
      });
      tl.to(mat, {
        emissiveIntensity: 0,
        duration: 0.9,
        ease: 'sine.inOut',
        onUpdate: () => mat && (mat.needsUpdate = true)
      });
      tl.to({}, { duration: 1.2 }); // pause before next pulse

      tls.push(tl);
    });

    // cleanup: stop timelines and reset mats
    return () => {
      tls.forEach(t => t.kill && t.kill());
      targets.forEach((mesh) => {
        const mat = mesh.material;
        if (mat) {
          mat.emissiveIntensity = 0;
          // keep the map intact (we're not removing the logo), but clear emissive color if desired:
          // mat.emissive = new THREE.Color(0x000000);
          mat.emissiveMap = null;
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
              // Use the uploaded image as the emissiveMap for strip glow (these are strips, so this is fine)
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
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, camera);

      const intersectsDoor = doorRef.current ? raycaster.current.intersectObject(doorRef.current, true) : [];
      if (intersectsDoor.length > 0) {
        // rotate the Door object only using quaternion
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
      if ('colorSpace' in texture) texture.colorSpace = THREE.SRGBColorSpace;
      else texture.encoding = THREE.sRGBEncoding;
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
      if ('colorSpace' in texture) texture.colorSpace = THREE.SRGBColorSpace;
      else texture.encoding = THREE.sRGBEncoding;
      texture.anisotropy = 16;
      texture.flipY = false;
      texture.center.set(0, 0.5);
      texture.repeat.set(3, 0.9);
      texture.needsUpdate = true;
      let found = false;
      scene.traverse((obj) => {
        if (obj.isMesh && obj.name && obj.name.toLowerCase() === 'sidepannelleft') {
          if (obj.material && obj.material.name && obj.material.name.toLowerCase() === 'fridgecolor') {
            obj.material = new THREE.MeshStandardMaterial();
          }
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
      if ('colorSpace' in texture) texture.colorSpace = THREE.SRGBColorSpace;
      else texture.encoding = THREE.sRGBEncoding;
      texture.anisotropy = 16;
      texture.flipY = false;
      texture.center.set(0, 0.5);
      texture.repeat.set(3, 0.9);
      texture.needsUpdate = true;
      let found = false;
      scene.traverse((obj) => {
        if (obj.isMesh && obj.name && obj.name.toLowerCase() === 'sidepannelright') {
          if (obj.material && obj.material.name && obj.material.name.toLowerCase() === 'fridgecolor') {
            obj.material = new THREE.MeshStandardMaterial();
          }
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
        {/* Preset UI removed from scene; use the separate interface panel */}
      </Suspense>
    </>
  );
});
