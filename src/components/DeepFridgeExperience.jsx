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
    loader.load(
      imagePath,
      (tex) => {
        try {
          // Support multiple three.js versions: prefer encoding, fallback to colorSpace
          if (typeof tex.encoding !== 'undefined') tex.encoding = THREE.sRGBEncoding;
          else if (typeof tex.colorSpace !== 'undefined') tex.colorSpace = THREE.SRGBColorSpace;
        } catch (e) {}
        tex.flipY = false;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.center && tex.center.set(0.5, 0.5);
        tex.offset && tex.offset.set(0, 0);
        tex.repeat && tex.repeat.set(1, 1);
        tex.anisotropy = gl.capabilities?.getMaxAnisotropy ? gl.capabilities.getMaxAnisotropy() : (gl.capabilities?.maxAnisotropy || 16);
        tex.needsUpdate = true;


        // Clone the original material to preserve other properties
        const newMaterial = (mesh.material && mesh.material.clone) ? mesh.material.clone() : new THREE.MeshStandardMaterial();
        newMaterial.map = tex;
        // Ensure the material base color is neutral so the texture appears accurate
        try { if (newMaterial.color) newMaterial.color.set(0xffffff); } catch (e) {}

        // Normalize PBR defaults to produce consistent look across panels
        newMaterial.roughness = 0.6;
        newMaterial.metalness = 0.0;
        newMaterial.side = THREE.DoubleSide;
        // No emissive by default for panels
        try { newMaterial.emissive = new THREE.Color(0x000000); } catch (e) {}
        newMaterial.emissiveIntensity = 0;
        // Reasonable env map intensity if environment exists
        if (typeof newMaterial.envMapIntensity !== 'undefined') newMaterial.envMapIntensity = 1.0;

        // Slightly brighten the right panel to match front/left (fix darker appearance reported)
        try {
          const lowerName = (mesh.name || '').toLowerCase();
          if (lowerName === 'sidepannelright' || lowerName === 'sidepannelrightmesh' || lowerName.includes('right')) {
            // multiply base color slightly to compensate for darker lighting/UVs
            if (newMaterial.color) newMaterial.color.multiplyScalar(1.06);
          }
        } catch (e) {}

        newMaterial.needsUpdate = true;

        // Assign material and record texture for cleanup
        mesh.material = newMaterial;
        currentTextures.current[mesh.name] = tex;
      },
      undefined,
      (err) => {
        console.warn('Failed to load texture', imagePath, err);
      }
    );
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
    threeScene.background = null;
    scene.scale.set(2.5, 2.5, 2.5);
    scene.position.set(0.2, -1.16, 0);

    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        originalMaterials.current[obj.name] = obj.material.clone();
      }
    });

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
