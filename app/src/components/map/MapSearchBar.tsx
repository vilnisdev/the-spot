'use client'

import { useState, useRef, useEffect } from 'react'
import { searchSpotsAction, type SearchSpotResult } from '@/app/actions/spots'
import styles from './map.module.css'

interface MapSearchBarProps {
  onSelectSpot: (spot: SearchSpotResult) => void
}

export default function MapSearchBar({ onSelectSpot }: MapSearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchSpotResult[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!query.trim()) {
      setResults([])
      return
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true)
      const res = await searchSpotsAction(query)
      setLoading(false)
      if ('results' in res) {
        if (res.results.length === 1) {
          onSelectSpot(res.results[0])
          setQuery('')
          setResults([])
        } else {
          setResults(res.results)
        }
      }
    }, 350)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, onSelectSpot])

  function handleSelect(spot: SearchSpotResult) {
    onSelectSpot(spot)
    setQuery('')
    setResults([])
  }

  return (
    <div className={styles.searchBarWrap}>
      {results.length > 1 && (
        <ul className={styles.searchResults} role="listbox">
          {results.map((s) => (
            <li key={s.id}>
              <button
                className={styles.searchResultItem}
                onClick={() => handleSelect(s)}
                role="option"
              >
                {s.title}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.searchBar}>
        <input
          type="search"
          placeholder="Search spots or tags…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.searchInput}
          aria-label="Search spots"
        />
        {loading && <span className={styles.searchSpinner} aria-hidden />}
      </div>
    </div>
  )
}
