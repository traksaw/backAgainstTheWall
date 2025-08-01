"use client";

import React from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ContactForm() {
    const [state, handleSubmit] = useForm("mldllrrw");
    if (state.succeeded) {
        return <p>Thank you for your submission! Our team will reach out to your email within 1-2 business days</p>;
    }
    return (
        // here's the header and description
        <div className="space-y-8">
            <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h2>
                <p className="text-xl text-gray-600 leading-relaxed">
                    Interested in screenings, partnerships, or panel discussions? We'd love to connect with sponsors,
                    grantors, and investors.
                </p>
            </div>
            {/*here is the form itself*/}
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-6">
                    <Input
                        placeholder="Name"
                        id='name'
                        name="name"
                        className="border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] rounded-lg py-3"
                    />
                    <ValidationError
                        prefix="Name"
                        field="name"
                        errors={state.errors}
                    />
                    <Input
                        type="email"
                        placeholder="Email"
                        className="border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] rounded-lg py-3"
                    />
                    <ValidationError
                        prefix="Email"
                        field="email"
                        errors={state.errors}
                    />
                </div>

                <Input
                    placeholder="Organization (optional)"
                    className="border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] rounded-lg py-3"
                />
                <ValidationError
                    prefix="Organization"
                    field="organization"
                    errors={state.errors}
                />
                <Textarea
                    placeholder="Message"
                    rows={5}
                    className="border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] rounded-lg resize-none"
                />
                <ValidationError
                    prefix="Message"
                    field="message"
                    errors={state.errors}
                />
                <Button className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold w-full py-3 rounded-lg">
                    Send Message
                </Button>
                <ValidationError
                    errors={state.errors}
                />
            </form>
        </div>
    );
}