import React, { JSX } from 'react';
import { FadeInUp } from "@/components/ui/fade-in";
import Link from 'next/link';

export default function Footer(): JSX.Element {
    return (
        <div>
            {/* Footer with Copyright */}
            <FadeInUp delay={1400} duration={800}>
                <div className="mt-16 pt-8 border-t border-gray-200 text-center">
                                        <p className="text-gray-500 text-sm">© 2024 Back Against the Wall. All rights reserved.</p>
                    <div className="mt-2 space-x-3 text-sm">
                        <Link href="/terms" className="text-gray-500 hover:text-[#B95D38] transition-colors">Terms</Link>
                        <span className="text-gray-300">•</span>
                        <Link href="/privacy" className="text-gray-500 hover:text-[#B95D38] transition-colors">Privacy</Link>
                    </div>
                    <span className="mt-2">
                        <Link 
                            href="https://waskarmiguelpaulino.netlify.app/" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 text-sm hover:text-[#B95D38] transition-colors duration-300"
                        >
                            Developed by Waskar Paulino 
                        </Link> 
                    </span> 
                    <br />
                     <span className="mt-2">
                        <Link 
                            href="https://www.linkedin.com/in/jasonarceo/" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 text-sm hover:text-[#B95D38] transition-colors duration-300"
                        >
                            Designed by Jason Arceo 
                        </Link>
                    </span>
                </div>
            </FadeInUp>
        </div>
    );
}