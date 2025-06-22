import { Github } from "lucide-react";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef,useMemo } from "react";
import { motion } from "framer-motion";

const NoteBook = ({ url }) => {
    const { scene } = useGLTF(url);
    const group = useRef();
    const clonedScene = useMemo(() => scene.clone(true), [scene]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        group.current.rotation.z = -0.2 - (1 + Math.sin(t / 1.5)) / 20;
        group.current.rotation.x = Math.cos(t / 4) / 8;
        group.current.rotation.y = Math.sin(t / 4) / 8;
        group.current.position.y = (1 + Math.sin(t / 1.5)) / 10;
    });
    return (
        <group
            ref={group}
            position={[4, 0, -5]}
            scale={3}
            rotation={[0, 0, 0]}
        >
            <primitive object={clonedScene} />
        </group>
    )
};
export default function Hero() {
    return (
        <>
            <section id="hero" className="flex flex-row w-full min-h-screen items-center justify-between relative">
                <div className="flex flex-col w-[90%] h-full items-start justify-center gap-2 pl-60">
                    <motion.h1 initial={{y: -60, opacity:0}} animate={{y: 0, opacity:1}} transition={{duration: 1,delay:1, ease: "easeOut"}} className="text-3xl font-extrabold font-mono">Take Your Notes One Dimension Further!</motion.h1>
                    <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{duration: 1,delay:1.5, ease: "easeIn"}} className="text-md brightness-75 font-light">Drag, rotate, place — put your ideas into space.</motion.p>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.7, ease: "easeOut" }} className="flex flex-row w-full h-20 mt-5 gap-10 items-center ">
                        <a href="/3Dnotes" className="relative border-2 border-white rounded-4xl p-2 pl-5 pr-5 cursor-pointer hover:bg-white transition-all duration-300 hover:text-black">
                            Start Now
                        </a>
                        <a href="https://www.github.com/ToprakArslann/3Dnotes" className="flex flex-row items-center justify-center rounded-full h-11 bg-white text-black transition-all duration-300 hover:bg-gradient-to-r hover:from-[#7D2A9B] hover:via-[#C75757] hover:to-[#9353ED] hover:text-white hover:shadow-lg hover:shadow-purple-950 w-35 cursor-pointer p-0.5 group">
                            <Github /> GitHub
                        </a>
                    </motion.div>
                </div>
                <motion.div initial={{x:60, opacity:0}} animate={{x:0, opacity: 1}} transition={{duration: 1, delay:1.9,ease:"easeInOut"}} className="flex w-full h-full items-center justify-center">
                    <Canvas shadows className="flex w-full h-full items-center justify-center">
                            <ambientLight intensity={0.7} />
                            <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
                            <NoteBook url="NoteBookFoldedSSS.glb"/>
                    </Canvas>
                </motion.div>
            </section>
        </>
    )
}