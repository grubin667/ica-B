"use client"

import { useSearchParams } from 'next/navigation'
 
const initialize = () => {

  const searchParams = useSearchParams()
 
  const orgId = searchParams.get('orgId')
  const agencyId = searchParams.get('agencyId')
  const date = searchParams.get('date')
  return {orgId, agencyId, date}
}

const Home = () => {

	const params = initialize()
	console.log(params)
	const pString = `${params.orgId} ${params.agencyId} ${params.date}`
	console.log(`${params.orgId} ${params.agencyId} ${params.date}`)

	return (
		<section className="mt-48 flex flex-col items-center justify-center">
			<h1 className="text-6xl font-bold">Daily Email Click Handler</h1>
			<p>(pString)</p>
			<button>Proceed</button>
		</section>
	);
};

export default Home;
