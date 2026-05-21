import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Droplets, Sparkles } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => navigate('/dashboard'), 300);
            return 100;
          }
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isLoading, navigate]);

  const handleLogin = () => {
    setIsLoading(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <motion.div
            className="flex justify-center mb-8"
            animate={{
              rotate: isLoading ? 360 : 0,
            }}
            transition={{
              duration: 2,
              repeat: isLoading ? Infinity : 0,
              ease: "linear",
            }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-50" />
              <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-5 rounded-full">
                <Droplets className="w-12 h-12 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2"
            >
              CarWash Pro
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400"
            >
              Premium Management System
            </motion.p>
          </div>

          {!isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {/* Input fields */}
              <div className="space-y-4 mb-6">
                <div>
                  <input
                    type="email"
                    placeholder="Email address"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                  />
                </div>
              </div>

              {/* Login button */}
              <motion.button
                onClick={handleLogin}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full relative overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Sign In
                  <Sparkles className="w-4 h-4" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
                  initial={{ x: '100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>

              <p className="text-center text-gray-500 text-sm mt-4">
                Demo: Click to continue
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Loading spinner */}
              <div className="flex justify-center">
                <motion.div
                  className="relative w-20 h-20"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full" />
                </motion.div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Loading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
