import { motion } from "framer-motion"
import { HashLink } from "react-router-hash-link"

export default function Header() {
    return(
        <>
            <motion.header initial={{opacity:0}} animate={{opacity:1}} transition={{duration: 1,delay:1.5, ease: "easeIn"}} className="flex items-center justify-between fixed top-0 w-full h-16 p-10 z-50">
                <a href="" className="text-2xl font-bold cursor-pointer">3Dnotes</a>
                <div className="flex flex-row items-center gap-10">  
                    <li className="flex flex-row list-none gap-10 tracking-wide">
                    <HashLink smooth to="#hero" className="relative after:bg-white after:absolute after:h-0.5 after:w-0 after:bottom-0 after:left-0 hover:after:w-full after:transition-all after:duration-300 cursor-pointer">Home</HashLink>
                    <HashLink smooth to="#features" className="relative after:bg-white after:absolute after:h-0.5 after:w-0 after:bottom-0 after:left-0 hover:after:w-full after:transition-all after:duration-300 cursor-pointer">Features</HashLink>
                    <HashLink smooth to="#about" className="relative after:bg-white after:absolute after:h-0.5 after:w-0 after:bottom-0 after:left-0 hover:after:w-full after:transition-all after:duration-300 cursor-pointer">About</HashLink>
                    </li>
                    <a href="#/Start" className="relative border-2 border-white rounded-4xl p-3 pl-5 pr-5 cursor-pointer hover:bg-white transition-all duration-300 hover:text-black flex-shrink-0">Get Started</a>
                </div>
            </motion.header>
        </>
    )
}