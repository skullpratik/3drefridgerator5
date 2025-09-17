import React, { useEffect, useRef, forwardRef, useImperativeHandle, Suspense } from "react";
import { useThree } from "@react-three/fiber";
import { Environment, ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

// ...existing code...

useGLTF.preload("/models/deepfreezer.glb");

export const Experience = forwardRef(function DeepFridgeExperience(
  { ledEnabled = true, onAssetLoaded },
  ref
) {
  const { scene: threeScene, camera, gl } = useThree();
  const { scene } = useGLTF("/models/deepfreezer.glb");

  const door1Ref = useRef(null);
  const door2Ref = useRef(null);
  const isDoor1Open = useRef(false);
  const isDoor2Open = useRef(false);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  const originalMaterials = useRef({});
  const currentTextures = useRef({});

  // 🔹 Apply texture logic remains the same
  const applyTexture = (mesh, imagePath) => {
    if (!mesh) return;
    if (currentTextures.current[mesh.name]) {
      currentTextures.current[mesh.name].dispose();
      currentTextures.current[mesh.name] = null;
    }
    if (!imagePath) {
      if (originalMaterials.current[mesh.name]) {
        mesh.material = originalMaterials.current[mesh.name];
        mesh.material.needsUpdate = true;
      }
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(imagePath, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = false;
      tex.anisotropy = gl.capabilities?.getMaxAnisotropy() || 16;

      const newMaterial = mesh.material.clone();
      newMaterial.map = tex;
      newMaterial.needsUpdate = true;

      mesh.material = newMaterial;
      currentTextures.current[mesh.name] = tex;
    });
  };

  const applyToTarget = (name, imagePath) => {
    const target = scene.getObjectByName(name);
    if (!target) return;

    if (target.isMesh && target.geometry?.attributes?.uv) {
      applyTexture(target, imagePath);
    } else if (target.isObject3D) {
      target.traverse((child) => {
        if (child.isMesh && child.geometry?.attributes?.uv) {
          applyTexture(child, imagePath);
        }
      });
    }
  };

  useImperativeHandle(ref, () => ({
    applyFrontTexture: (url) => applyToTarget("FrontPannel", url),
    resetFront: () => applyToTarget("FrontPannel", null),
    applyLeftTexture: (url) => applyToTarget("SidePannelLeft", url),
    resetLeft: () => applyToTarget("SidePannelLeft", null),
    applyRightTexture: (url) => applyToTarget("SidePannelRight", url),
    resetRight: () => applyToTarget("SidePannelRight", null),
  }));

  // Initial setup
  useEffect(() => {
    if (!scene || !threeScene) return;
    // Use a subtle neutral backdrop for product shots
    threeScene.background = new THREE.Color(0x22272b);
    scene.scale.set(2.5, 2.5, 2.5);
    scene.position.set(0.2, -1.16, 0);

    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        originalMaterials.current[obj.name] = obj.material.clone();
      }
    });

    // Configure renderer for cinematic product rendering
    if (gl) {
      try { gl.toneMapping = THREE.ACESFilmicToneMapping; } catch (e) {}
      if (gl.toneMappingExposure !== undefined) gl.toneMappingExposure = 1.0;
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
      gl.physicallyCorrectLights = true;
      if (gl.outputColorSpace !== undefined) {
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }
      try { gl.setClearColor(new THREE.Color(0x22272b), 1); } catch (e) {}
    }

    // Add studio-style lights if scene looks underlit
    const existingLights = [];
    threeScene.traverse((o) => { if (o.isLight) existingLights.push(o); });
    if (existingLights.length < 3) {
      const ambient = new THREE.AmbientLight(0xffffff, 0.15);
      threeScene.add(ambient);

      const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 0.25);
      threeScene.add(hemi);

      const rim = new THREE.DirectionalLight(0xe6f3ff, 0.18);
      rim.position.set(-2.5, 3.2, -2.5);
      rim.castShadow = false;
      threeScene.add(rim);

      const key = new THREE.SpotLight(0xfff6e8, 0.9);
      key.position.set(2.2, 4.0, 2.0);
      key.angle = Math.PI / 7;
      key.penumbra = 0.4;
      key.castShadow = true;
      key.shadow.bias = -0.0005;
      key.shadow.radius = 2;
      key.target.position.set(0, 0.5, 0);
      threeScene.add(key);
      threeScene.add(key.target);
    }

    // Polish materials: gentle roughness/metalness and add PMREM envMap for balanced reflections
    try {
      const hdrPath = "photo_studio_01_1k.hdr";
      const texLoader = new THREE.TextureLoader();
      texLoader.load(hdrPath, (hdrTex) => {
        hdrTex.mapping = THREE.EquirectangularReflectionMapping;
        const pmremGen = new THREE.PMREMGenerator(gl);
        const envMap = pmremGen.fromEquirectangular(hdrTex).texture;

        scene.traverse((obj) => {
          if (obj.isMesh && obj.material && obj.material.type === 'MeshStandardMaterial') {
            if (obj.material.roughness === undefined || obj.material.roughness < 0.25) obj.material.roughness = 0.25;
            if (obj.material.metalness === undefined) obj.material.metalness = 0.08;
            if (!obj.material.envMap) {
              obj.material.envMap = envMap;
              obj.material.envMapIntensity = 0.5;
            }
            obj.material.needsUpdate = true;
          }
        });

        hdrTex.dispose();
        pmremGen.dispose();
      });
    } catch (err) {
      console.warn('PMREM environment mapping failed for DeepFridge:', err.message);
    }

    if (onAssetLoaded) onAssetLoaded();
  }, [scene, threeScene, onAssetLoaded]);

  // Default textures
  useEffect(() => {
    if (!scene) return;
    applyToTarget("FrontPannel", "/texture/Deepfront.jpg");
    applyToTarget("SidePannelLeft", "/texture/DeepleftRight.jpg");
    applyToTarget("SidePannelRight", "/texture/DeepleftRight.jpg");
  }, [scene]);

  // Door animation
  useEffect(() => {
    if (!scene || !gl || !camera) return;

    door1Ref.current = scene.getObjectByName("Door1");
    door2Ref.current = scene.getObjectByName("Door2");

    const handleClick = (event) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, camera);

      if (door1Ref.current) {
        const intersects = raycaster.current.intersectObject(door1Ref.current, true);
        if (intersects.length > 0) {
          const targetRotation = isDoor1Open.current ? 0 : -(Math.PI / 2);
          gsap.to(door1Ref.current.rotation, { x: targetRotation, duration: 1 });
          isDoor1Open.current = !isDoor1Open.current;
          return;
        }
      }
      if (door2Ref.current) {
        const intersects = raycaster.current.intersectObject(door2Ref.current, true);
        if (intersects.length > 0) {
          const targetRotation = isDoor2Open.current ? 0 : -Math.PI / 2;
          gsap.to(door2Ref.current.rotation, { x: targetRotation, duration: 1 });
          isDoor2Open.current = !isDoor2Open.current;
        }
      }
    };

    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, [scene, camera, gl]);

  return (
    <Suspense fallback={null}>
      <Environment files="photo_studio_01_1k.hdr" background={false} intensity={1.2} />
      <ContactShadows
        position={[0, -1.15, 0]}
        opacity={0.6}
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={1.1}
        zoomSpeed={1}
        panSpeed={0.8}
        enablePan
        minDistance={2.5}
        maxDistance={20}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.5, 0]}
        makeDefault
      />
      

      {/* ✅ Model */}
      {scene && <primitive object={scene} />}

      {/* Postprocessing removed */}
    </Suspense>
  );
});
