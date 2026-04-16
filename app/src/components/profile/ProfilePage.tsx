'use client'

import { useState } from 'react'
import Link from 'next/link'
import PageNav from '@/components/shared/PageNav'
import SpotModal, { type SpotForModal } from '@/components/map/SpotModal'
import SpotEditForm from '@/components/map/SpotEditForm'
import {
  getSpotDetailAction,
  postCommentAction,
  deleteSpotAction,
  type MySpot,
} from '@/app/actions/spots'
import SpotCard from './SpotCard'
import styles from './profile.module.css'

interface Network {
  id: string
  name: string
}

interface ProfilePageProps {
  username: string
  spots: MySpot[]
  networks: Network[]
}

export default function ProfilePage({ username, spots: initialSpots, networks }: ProfilePageProps) {
  const [spots, setSpots] = useState<MySpot[]>(initialSpots)
  const [spotDetail, setSpotDetail] = useState<SpotForModal | null>(null)
  const [isAuthor, setIsAuthor] = useState(false)
  const [editingSpot, setEditingSpot] = useState<SpotForModal | null>(null)

  async function handleOpen(spot: MySpot) {
    const result = await getSpotDetailAction(spot.id)
    if (!('error' in result)) {
      setSpotDetail(result.spot)
      setIsAuthor(result.isAuthor)
    }
  }

  function handleEdit(spot: MySpot) {
    // Open detail first to get full SpotForModal, then switch to edit
    getSpotDetailAction(spot.id).then((result) => {
      if (!('error' in result)) {
        setEditingSpot(result.spot)
        setSpotDetail(null)
      }
    })
  }

  function handleModalEdit() {
    setEditingSpot(spotDetail)
    setSpotDetail(null)
  }

  async function handleDelete(spot: MySpot) {
    const { error } = await deleteSpotAction(spot.id)
    if (!error) {
      setSpots((prev) => prev.filter((s) => s.id !== spot.id))
    }
  }

  async function handleModalDelete() {
    const target = editingSpot ?? spotDetail
    if (!target) return
    const { error } = await deleteSpotAction(target.id)
    if (!error) {
      setSpots((prev) => prev.filter((s) => s.id !== target.id))
      setEditingSpot(null)
      setSpotDetail(null)
    }
  }

  async function handlePostComment(body: string) {
    if (!spotDetail) return
    const result = await postCommentAction(spotDetail.id, body)
    if (!('error' in result)) {
      setSpotDetail((prev) =>
        prev ? { ...prev, comments: [...(prev.comments ?? []), result.comment] } : prev
      )
    }
  }

  async function handleEditSave() {
    if (!editingSpot) return
    const result = await getSpotDetailAction(editingSpot.id)
    setEditingSpot(null)
    if (!('error' in result)) {
      setSpotDetail(result.spot)
      setIsAuthor(result.isAuthor)
      // Reflect edits immediately on the profile card
      const updatedNetworkNames = (result.spot.spot_networks ?? [])
        .map((sn) => networks.find((n) => n.id === sn.network_id)?.name)
        .filter((n): n is string => !!n)
      setSpots((prev) =>
        prev.map((s) =>
          s.id !== result.spot.id
            ? s
            : { ...s, title: result.spot.title, state: result.spot.state ?? null, network_names: updatedNetworkNames }
        )
      )
    }
  }

  function handleEditCancel() {
    const snapshot = editingSpot
    setEditingSpot(null)
    if (snapshot) setSpotDetail(snapshot)
  }

  return (
    <div className={styles.page}>
      <PageNav />

      {/* Profile header */}
      <header className={styles.profileHeader}>
        <div>
          <h1 className={styles.username}>{username}</h1>
          <p className={styles.spotCount}>
            {spots.length === 0
              ? 'No spots yet'
              : spots.length === 1
              ? '1 spot'
              : `${spots.length} spots`}
          </p>
        </div>
      </header>

      {/* My Spots list */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>My Spots</p>
        {spots.length === 0 ? (
          <p className={styles.emptyState}>You haven&apos;t pinned any spots yet.</p>
        ) : (
          <ul className={styles.spotsList}>
            {spots.map((spot) => (
              <SpotCard
                key={spot.id}
                spot={spot}
                onOpen={handleOpen}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </section>

      {/* My Networks */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>My Networks</p>
        {networks.length === 0 ? (
          <p className={styles.emptyState}>No networks yet.</p>
        ) : (
          <ul className={styles.networksList}>
            {networks.map((n) => (
              <li key={n.id} className={styles.networkItem}>{n.name}</li>
            ))}
          </ul>
        )}
      </section>

      {/* Spot modal */}
      <SpotModal
        spot={spotDetail}
        isAuthor={isAuthor}
        onClose={() => setSpotDetail(null)}
        onEdit={handleModalEdit}
        onPostComment={handlePostComment}
      />

      {/* Edit form */}
      {editingSpot && (
        <SpotEditForm
          spot={editingSpot}
          networks={networks}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
          onDelete={handleModalDelete}
        />
      )}
    </div>
  )
}
