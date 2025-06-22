import { motion } from "framer-motion"

export default function About() {
    return(
        <>
            <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6, ease: "easeOut" }} id="about" className="w-full min-h-screen flex flex-col pt-20 items-center justify-start relative gap-10">
                <div className="flex w-full h-20 items-center justify-center text-5xl font-bold tracking-widest">About</div>
                <div className="flex flex-row items-center justify-between w-full h-full relative ">
                    <div className="flex w-full h-full relative">
                        <motion.div initial={{ y: -80, opacity:0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{once:true, amount: 0.2}} transition={{ duration: 1, delay:0.8, ease: "easeOut" }} className="flex items-center justify-center overflow-hidden absolute -top-[10%] right-[25%] rotate-12 w-60 h-80 min-[120rem]:w-70 min-[120rem]:h-90 rounded-3xl brightness-75 hover:rotate-10 hover:brightness-100 hover:scale-105 duration-300 bg-white/5 border border-white/30">
                            <img src="Card1.png" className="w-full h-full object-cover" alt="" />
                        </motion.div>
                        <motion.div initial={{ y: -80, opacity:0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{once:true, amount: 0.2}} transition={{ duration: 1, delay:0.9, ease: "easeOut" }} className="flex items-center justify-center overflow-hidden absolute top-[15%] left-[2%] -rotate-18 w-60 h-80 min-[120rem]:w-70 min-[120rem]:h-90 rounded-3xl brightness-75 hover:-rotate-15 hover:brightness-100 hover:scale-105 duration-300 bg-white/5 border border-white/30">
                            <img src="Card2.png" className="w-full h-full object-cover" alt="" />
                        </motion.div>
                        <motion.div initial={{ y: -80, opacity:0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{once:true, amount: 0.2}} transition={{ duration: 1, delay:1, ease: "easeOut" }} className="flex items-center justify-center overflow-hidden absolute bottom-[2%] right-[20%] -rotate-8 w-60 h-80 min-[120rem]:w-70 min-[120rem]:h-90 rounded-3xl brightness-75 hover:-rotate-5 hover:brightness-100 hover:scale-105 duration-300 bg-white/5 border border-white/30">
                            <img src="Card3.png" className="w-full h-full object-cover" alt="" />
                        </motion.div>
                        <motion.div initial={{ y: -80, opacity:0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{once:true, amount: 0.2}} transition={{ duration: 1, delay:1.1, ease: "easeOut" }} className="flex items-center justify-center overflow-hidden absolute -bottom-[25%] left-[10%] rotate-15 w-60 h-80 min-[120rem]:w-70 min-[120rem]:h-90 rounded-3xl brightness-75 hover:rotate-12 hover:brightness-100 hover:scale-105 duration-300 bg-white/5 border border-white/30">
                            <img src="Card4.png" className="w-full h-full object-cover" alt="" />
                        </motion.div>
                    </div>
                    <div className="flex flex-col w-full h-full p-10 backdrop-blur-md text-gray-200 shadow-inner">
                        <p className="mb-4 leading-relaxed">
                            <strong>3DNotes</strong> is a browser-based application that reimagines the way we take notes. Inspired by the idea that note-taking shouldn't be limited to flat surfaces, this project allows you to spatially place and visualize your ideas in a 3D environment.
                        </p>
                        <p className="mb-4">
                            The goal was simple: to build a tool where creativity meets organization. Drag, drop, rotate, and organize your thoughts in an intuitive 3D space—right in your browser.
                        </p>
                        <h3 className="text-xl font-semibold text-white mt-6 mb-2">Tech Stack</h3>
                        <ul className="list-disc list-inside text-purple-400">
                            <li>React + Vite</li>
                            <li>Three.js (via React Three Fiber)</li>
                            <li>TailwindCSS for UI</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-white mt-6 mb-2">About Me</h3>
                        <p className="mb-4">
                            Hi! I'm Toprak Arslan, a computer programming student who enjoys creating interactive web experiences. 3DNotes is more than a school project—it's the beginning of my journey into the world of WebGL and creative interfaces.
                        </p>

                        <h3 className="text-xl font-semibold text-white mt-6 mb-2">What's Next?</h3>
                        <ul className="list-disc list-inside text-purple-400">
                            <li>Mobile-responsive version</li>
                            <li>BookMarks</li>
                        </ul>

                        <p className="mt-6 text-sm text-gray-400">
                            Check out the project on GitHub: <a href="https://github.com/ToprakArslann/3Dnotes" className="text-purple-400 hover:text-purple-300">3DNotes Repository</a>
                        </p>
                    </div>
                </div>
            </motion.div>
        </>
    )
}