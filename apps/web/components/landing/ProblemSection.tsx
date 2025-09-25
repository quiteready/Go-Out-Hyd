const ProblemSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Knowledge Workers&rsquo; Biggest Challenge—
            <span className="text-primary">Solved</span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📁</span>
                </div>
              </div>

              <div className="flex-1">
                <blockquote className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-400 mb-6 italic">
                  &ldquo;I used to spend hours digging through documents and
                  files to find specific information. Now I just ask RAGI and
                  get instant answers from all my content.&rdquo;
                </blockquote>

                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      Marcus Rodriguez
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Research Director, InnovateLab
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-primary mb-2">73%</div>
              <div className="text-gray-600 dark:text-gray-400">
                of time wasted searching for information
              </div>
            </div>
            <div className="p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-primary mb-2">45min</div>
              <div className="text-gray-600 dark:text-gray-400">
                average daily time lost to document hunting
              </div>
            </div>
            <div className="p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-3xl font-bold text-primary mb-2">92%</div>
              <div className="text-gray-600 dark:text-gray-400">
                of knowledge workers struggle with information overload
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
