'use client'
import { useEffect, useState } from 'react'
import { getCastAndCrew } from '@/lib/sanity'

interface CastMember {
  name: string
  role: string
  description: string
  image: string
  readMoreUrl?: string
  order?: number
  imageAlt?: string
}

export default function TestSanity() {
  const [castData, setCastData] = useState<CastMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getCastAndCrew()
        setCastData(data)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sanity Test Page</h1>
      <p className="mb-4">Found {castData.length} cast member(s)</p>

      {castData.map((member, index) => (
        <div key={index} style={{ marginBottom: '2rem', border: '1px solid #ccc', padding: '1rem' }}>
          {member.image && (
            <img
              src={member.image}
              alt={member.imageAlt || member.name}
              style={{ width: '200px', height: '200px', objectFit: 'cover', marginBottom: '1rem' }}
            />
          )}
          <h3>{member.name}</h3>
          <p><strong>{member.role}</strong></p>
          <p>{member.description}</p>
          {member.readMoreUrl && (
            <a href={member.readMoreUrl} target="_blank" rel="noopener noreferrer">
              Read More
            </a>
          )}
        </div>
      ))}
    </div>
  )
}