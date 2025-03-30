import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Edges, GizmoHelper, GizmoViewport } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const CubeR = ({onDraggingChange, onRotatingChange}) => {
  const meshRef = useRef();
  const [selected, setSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const {camera, gl, controls} = useThree();
  const plane = new THREE.Plane(new THREE.Vector3(0,1,0), 2);

  useEffect(() => {
    onRotatingChange(isRotating);
  },[isRotating, onRotatingChange]);
  useEffect(() => {
    onDraggingChange(isDragging);
  },[isDragging, onDraggingChange]);
  useEffect(() => {
    let previousMouseX = 0;
    const handleMouseMove = (event) => {
      if((!isDragging && !isRotating)|| !meshRef.current) return;

      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;
    
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse,camera);
      const point = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane,point);

      if(isDragging){
        meshRef.current.position.set(point.x, 2, point.z);
      }
      if(isRotating){
        const deltaX = point.x - previousMouseX;
        const rotationSpeed = 0.2;
        meshRef.current.rotation.y -= deltaX * rotationSpeed;
      }
      previousMouseX = point.x;
    
    };

    const handleMouseUp = () =>{ 
      setIsDragging(false);
      setIsRotating(false);
      if(controls) controls.enabled = true;
    };

    if(isRotating){
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      if(controls) controls.enabled = false;
    }
    if(isDragging){
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      if(controls) controls.enabled = false;
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isRotating, camera,gl, controls, plane]);
  return(
    <mesh ref={meshRef} position={[0,2,0]} onClick={(e) => {
      e.stopPropagation();
      setSelected(!selected);
    }}>
      <boxGeometry args={[6,0.5,5]}/>
      <pointLight position={[0,2,0]} intensity={10} color={0xffffff}/>
      <meshLambertMaterial color="595959" emissive={"#595959"}/>
    
      {selected && (
        <>
          <Edges>
            <lineSegments>
              <edgesGeometry attach="geometry" args={[meshRef.current.geometry]} />
              <lineBasicMaterial color={"0xff0000"}/>
            </lineSegments>
          </Edges>
          <Html position={[3,0.3,0]}>
            <div style={{
              padding: "8px",
              gap: "8px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              borderRadius: "4px",
              border: "none",
            }}>
              <button style={{
                background: "white",
                margin: "auto",
                cursor: "grab",
              }}
              onMouseDown={(e) =>{
                e.stopPropagation();
                setIsDragging(true);
              }}
              onMouseUp={() => setIsDragging(false)}
              >
                <img src="src/assets/hand-pointer-solid.svg" style={{width: "20px"}} draggable="false"/>
              </button>
              <button style={{
                background: "white",
                margin: "auto",
                cursor: "grab",
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsRotating(true);
                }}
                onMouseUp={() => setIsRotating(false)}
                >
                <img src="src/assets/rotate-solid.svg" style={{width: "20px"}} draggable="false"/>
              </button>
              <button style={{
                background: "white",
                margin: "auto",
                cursor: "grab",
                }}>
                <img src="src/assets/marker-solid.svg" style={{width: "20px"}} draggable="false"/>
              </button>
            </div>
          </Html>
        </>
      )}
    </mesh>
  )
}


const App = () => {
  const [isRotating, setIsRotating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleRotatingChange = (rotating) => {
    setIsRotating(rotating);
  };
  const handleDraggingChange = (dragging) => {
    setIsDragging(dragging);
  };

  return (
    <Canvas gl={{antialias: true}} style={{height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <OrbitControls enabled={!isRotating && !isDragging}/>
      <spotLight position={[0,5,0]} intensity={10} color={0xffffff}/>
      <color attach="background" args={["#000000"]}/>
      <gridHelper args={[1000,500,'red', 'white']}/>
      <GizmoHelper
      alignment="bottom-right" margin={[80,80]} >
        <GizmoViewport axisColors={["red", "green", "blue"]} labelColor="black"/>
      </GizmoHelper>
      <CubeR onDraggingChange={handleDraggingChange} onRotatingChange={handleRotatingChange}/>
    </Canvas>
  )
}

export default App;
