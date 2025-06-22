import { Folder, Github, Grab, Hand, Palette, Pointer, RefreshCcw, Save } from "lucide-react";
import { useRef, useState } from "react";
import { motion } from "framer-motion";

function FeatureCard({ icon, title, desc }) {
    const divRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
            style={{
                backgroundImage: `
                    radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,${opacity ? 0.06 : 0}), transparent 40%),
                    radial-gradient(#ffffff11 1px, transparent 1px)
                `,
                backgroundSize: "100% 100%, 20px 20px",
                transition: "background-image 0.3s"
            }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-white/20 transition min-h-60"
        >
            <div className="text-white mb-4">{icon}</div>
            <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
            <p className="text-gray-400 text-sm">{desc}</p>
        </div>
    );
}

export default function Features() {
    return (
        <>
            <motion.div id="features" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease: "easeOut" }} className="w-full min-h-screen flex flex-col pt-20 items-center justify-start relative gap-10">
                <div className="flex w-full h-20 items-center justify-center text-5xl font-bold tracking-widest">Features</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-10 pr-10">
                    <FeatureCard
                        icon={<Grab size={40} />}
                        title="3D Note Placement"
                        desc="Drag and position your notes in a 3D environment. Organize better using your visual memory."
                    />
                    <FeatureCard
                        icon={<RefreshCcw size={40} />}
                        title="Real Time Update"
                        desc="The changes you make are reflected instantly. No more waiting while taking notes."
                    />
                    <FeatureCard
                        icon={<Palette size={40} />}
                        title="Customizable Themes"
                        desc="Personalize your experience with dark mode, color selection, and note styles."
                    />
                    <FeatureCard
                        icon={<Save size={40} />}
                        title="Scene Saving & Loading"
                        desc="Download your entire 3D scene as a file, share or re-upload."
                    />
                    <FeatureCard
                        icon={<Pointer size={40} />}
                        title="Easy Navigation"
                        desc="Navigate the stage smoothly with mouse or touch controls."
                    />
                    <FeatureCard
                        icon={<Folder size={40} />}
                        title="Folder & Labeling System"
                        desc="Give your notes meaning with labels and colors. Find everything easily."
                    />
                </div>
            </motion.div>
        </>
    )
}