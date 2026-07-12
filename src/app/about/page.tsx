import Link from 'next/link'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const metadata = {
  title: 'About — Nevada School Ratings',
  description:
    'Learn about Nevada school star ratings, the NDE Index Score methodology, proficiency and growth metrics, and the data source behind Nevada School Ratings.',
}

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <img
            src={`${basePath}/favicon.svg`}
            alt=""
            width={28}
            height={28}
          />
          <h1 className="text-base font-semibold text-gray-900 leading-tight">
            Nevada School Ratings
          </h1>
        </div>
        <Link
          href={`${basePath}/schools`}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline shrink-0"
        >
          ← Back to map
        </Link>
      </header>

      {/* Body */}
      <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">About</h2>

        {/* Star Ratings */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Star Ratings</h3>
          <p className="text-gray-700 leading-relaxed">
            The Nevada Department of Education (NDE) assigns each school a star rating from 1 to 5
            based on its Index Score. A 1-star rating indicates the lowest performing schools, while
            a 5-star rating indicates the highest performing schools. Not all schools receive a star
            rating — some schools may be excluded due to insufficient data or other eligibility
            criteria.
          </p>
        </section>

        {/* Index Score */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Index Score</h3>
          <p className="text-gray-700 leading-relaxed">
            The Index Score is a composite score ranging from 0 to 100, calculated by NDE from
            multiple academic performance metrics. It provides an overall measure of a school&apos;s
            performance and is the basis for the star rating assignment.
          </p>
        </section>

        {/* Proficiency Metrics */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Proficiency Metrics</h3>
          <p className="text-gray-700 leading-relaxed">
            ELA Proficient and Math Proficient represent the percentage of
            students at a school who met grade-level standards on Nevada state assessments. These
            percentages reflect how well students are performing against established academic
            benchmarks in each subject area.
          </p>
        </section>

        {/* Growth Metrics */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Growth Metrics</h3>
          <p className="text-gray-700 leading-relaxed">
            ELA Growth and Math Growth come from the Nevada Growth Model, which measures
            year-over-year student progress by comparing each student to academic peers statewide —
            students who had similar prior test scores.
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            Each figure is the percentage of students at the school who met their individual growth
            target for the year — the amount of progress needed to reach or stay proficient. A
            higher percentage means more students are on track.
          </p>
        </section>

        {/* Data Source */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Source</h3>
          <p className="text-gray-700 leading-relaxed">
            All school performance data is sourced from the Nevada Department of Education (NDE).
            The most recent data available on this site is from the <strong>2024–25 school year</strong>.
            For the latest official reports and additional detail, visit the Nevada Accountability Portal:
          </p>
          <a
            href="https://nevadareportcard.nv.gov/di/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-blue-600 hover:text-blue-800 hover:underline break-all"
          >
            https://nevadareportcard.nv.gov/di/
          </a>
          <p className="text-gray-700 leading-relaxed mt-3">
            Growth percentiles come from the Nevada Growth Model:
          </p>
          <a
            href="https://ngma.bighorn.doe.nv.gov/nvgrowthmodel"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-blue-600 hover:text-blue-800 hover:underline break-all"
          >
            https://ngma.bighorn.doe.nv.gov/nvgrowthmodel
          </a>
        </section>

        {/* Disclaimer */}
        <section className="mb-8 p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Disclaimer</h3>
          <p className="text-gray-700 leading-relaxed">
            This site is not affiliated with or endorsed by the Nevada Department of Education. Data
            is provided for informational purposes only. Always refer to official NDE sources for
            the most current and authoritative information.
          </p>
        </section>
      </main>
    </div>
  )
}
