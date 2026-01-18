/**
 * Landing Page - Unified entry point for Students and Admins
 */
import { Link } from 'react-router-dom';
import { User, ShieldCheck, Trophy, ArrowRight } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <Toaster position="top-right" />

            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#030712] to-[#030712] z-0"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>

            <div className="relative z-10 max-w-4xl w-full text-center space-y-12">
                {/* Header */}
                <div className="space-y-4 animate-fadeIn">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-4 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                        <Trophy className="w-12 h-12 text-indigo-400" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
                        RVCE <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">SPORTS</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Official Sports Department Management System
                    </p>
                </div>

                {/* Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">

                    {/* Student Card */}
                    <Link to="/student/register" className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500"></div>
                        <div className="relative h-full bg-[#0a0a16] border border-white/10 rounded-2xl p-8 hover:border-indigo-500/50 transition-all duration-300 flex flex-col items-center text-center group-hover:-translate-y-1">
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <User className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Student Portal</h2>
                            <p className="text-gray-400 mb-8 flex-1">
                                Register for sports, view upcoming events, and track your participation status.
                            </p>
                            <span className="btn btn-primary w-full flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                                Student Login <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                            </span>
                        </div>
                    </Link>

                    {/* Admin Card */}
                    <Link to="/login" className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500"></div>
                        <div className="relative h-full bg-[#0a0a16] border border-white/10 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 flex flex-col items-center text-center group-hover:-translate-y-1">
                            <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <ShieldCheck className="w-8 h-8 text-cyan-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Admin Portal</h2>
                            <p className="text-gray-400 mb-8 flex-1">
                                Manage events, approve student registrations, and generate reports.
                            </p>
                            <span className="btn btn-secondary w-full flex items-center justify-center gap-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                                Admin Login <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                            </span>
                        </div>
                    </Link>

                </div>

                {/* Footer */}
                <p className="text-sm text-gray-600">
                    © {new Date().getFullYear()} RV College of Engineering. All rights reserved.
                </p>
            </div>
        </div>
    );
}
