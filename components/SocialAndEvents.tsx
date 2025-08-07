import React, { JSX } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Instagram, Twitter, Facebook, ExternalLink, Users, Calendar } from "lucide-react";
import { FadeIn, FadeInRight } from "@/components/ui/fade-in";

export default function SocialAndEvent(): JSX.Element {
    return (
        <section className="py-24 bg-gray-50">
            <FadeInRight delay={400} duration={800}>
                <div className="space-y-12">
                    {/* Follow Our Journey Section */}
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Follow Our Journey</h3>
                        <div className="flex space-x-4">
                            {[
                                { icon: Instagram, label: "Instagram" },
                                { icon: Twitter, label: "Twitter" },
                                { icon: Facebook, label: "Facebook" }
                            ].map((social, index) => (
                                <FadeIn key={social.label} delay={600 + index * 100} duration={600} direction="up">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="border-gray-300 text-gray-600 hover:border-[#B95D38] hover:text-[#B95D38] rounded-full w-12 h-12 bg-transparent transform hover:scale-110 transition-all duration-300"
                                        aria-label={social.label}
                                    >
                                        <social.icon className="w-5 h-5" />
                                    </Button>
                                </FadeIn>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Events Section */}
                    <div className="space-y-6">
                        <FadeIn delay={800} duration={600} direction="up">
                            <h3 className="text-2xl font-bold text-gray-900">Upcoming Events</h3>
                        </FadeIn>

                        <div className="space-y-4">
                            {/* Panel Discussion Event */}
                            <FadeIn delay={1000} duration={600} direction="up">
                                <Card className="border-gray-200 hover:border-[#B95D38] transition-all duration-300 hover:shadow-lg transform hover:scale-105">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center space-x-2 text-[#B95D38]">
                                                    <Users className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Panel Discussion</span>
                                                </div>
                                                <h4 className="font-semibold text-gray-900">Financial Psychology & Film</h4>
                                                <p className="text-sm text-gray-600">Post-screening discussion with creators</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-[#B95D38] hover:bg-[#B95D38]/10 transform hover:scale-110 transition-all duration-300 ml-4"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </FadeIn>

                            {/* Private Screening Event */}
                            <FadeIn delay={1200} duration={600} direction="up">
                                <Card className="border-gray-200 hover:border-[#B95D38] transition-all duration-300 hover:shadow-lg transform hover:scale-105">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center space-x-2 text-[#B95D38]">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Private Screening</span>
                                                </div>
                                                <h4 className="font-semibold text-gray-900">For Investors & Partners</h4>
                                                <p className="text-sm text-gray-600">Exclusive viewing and networking</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-[#B95D38] hover:bg-[#B95D38]/10 transform hover:scale-110 transition-all duration-300 ml-4"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </FadeIn>
                        </div>
                    </div>
                </div>
            </FadeInRight>
        </section>
    );
}