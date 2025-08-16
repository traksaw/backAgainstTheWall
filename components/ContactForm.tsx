import React, { JSX, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Instagram, Twitter, Facebook, ExternalLink, Users, Calendar, CheckCircle } from "lucide-react";
import { FadeIn, FadeInUp, FadeInLeft, FadeInRight } from "@/components/ui/fade-in";

// TypeScript interfaces
interface FormData {
    name: string;
    email: string;
    organization: string;
    message: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    message?: string;
}

export default function ContactForm(): JSX.Element {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        organization: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!formData.message.trim()) {
            newErrors.message = 'Message is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('https://formspree.io/f/mldllrrw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setIsSuccess(true);
                setFormData({ name: '', email: '', organization: '', message: '' });
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <section className="py-24 bg-gray-50">
                <div className="container mx-auto px-6">
                    <div className="max-w-6xl mx-auto">
                        <FadeIn duration={800}>
                            <div className="text-center p-8 bg-green-50 rounded-lg border border-green-200">
                                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-green-800 mb-2">Thank You!</h3>
                                <p className="text-green-700">
                                    Thank you for your submission! Our team will reach out to your email within 1-2 business days.
                                </p>
                                <Button
                                    onClick={() => setIsSuccess(false)}
                                    variant="outline"
                                    className="mt-4 border-green-300 text-green-700 hover:bg-green-100"
                                >
                                    Send Another Message
                                </Button>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>
        );
    }
    return (
        <section className="py-8 bg-gray-50">
            <div className="container mx-auto px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Two Column Grid Layout */}
                        {/* Left Column - Contact Form */}
                        <div>
                            <FadeInLeft delay={200} duration={800}>
                                <div className="space-y-8">
                                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h2>
                                    <p className="text-xl text-gray-600 leading-relaxed mb-6">
                                        Interested in screenings, partnerships, or panel discussions? We'd love to connect with sponsors,
                                        grantors, and investors.
                                    </p>
                                    <br />
                                </div>
                                {/* Form with staggered animations */}
                                <div className="space-y-6">
                                    <FadeIn delay={400} duration={600} direction="up">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <Input
                                                    placeholder="Name"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] rounded-lg py-3 transition-all duration-300 ${errors.name ? 'border-red-500' : ''}`}
                                                />
                                                {errors.name && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                                                )}
                                            </div>
                                            <div>
                                                <Input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    placeholder="Email"
                                                    className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] rounded-lg py-3 transition-all duration-300 ${errors.email ? 'border-red-500' : ''}`}
                                                />
                                                {errors.email && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                                                )}
                                            </div>
                                        </div>
                                    </FadeIn>

                                    <FadeIn delay={600} duration={600} direction="up">
                                        <Input
                                            placeholder="Organization (optional)"
                                            name="organization"
                                            value={formData.organization}
                                            onChange={handleInputChange}
                                            className="border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] rounded-lg py-3 transition-all duration-300"
                                        />
                                    </FadeIn>

                                    <FadeIn delay={800} duration={600} direction="up">
                                        <Textarea
                                            placeholder="Message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            rows={5}
                                            className={`border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] rounded-lg resize-none transition-all duration-300 ${errors.message ? 'border-red-500' : ''}`}
                                        />
                                        {errors.message && (
                                            <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                                        )}
                                    </FadeIn>

                                    <FadeIn delay={1000} duration={600} direction="up">
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold w-full py-3 rounded-lg transform hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? 'Sending...' : 'Send Message'}
                                        </Button>
                                    </FadeIn>
                                </div>
                            </FadeInLeft>
                        </div>
                    </div>
                </div>
            
        </section>
    );
}