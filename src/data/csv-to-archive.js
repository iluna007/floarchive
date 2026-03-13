#!/usr/bin/env node
/**
 * Converts archive.csv (from Google Sheets export) to archive.js
 * Usage: node csv-to-archive.js [input.csv] [output.js]
 * Default: reads archive.csv, writes archive.js in same folder
 */

import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '.')

function parseCSV(text) {
  const rows = []
  let current = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',' || c === '\n' || (c === '\r' && text[i + 1] === '\n')) {
        if (c === '\r') i++
        current.push(field.trim())
        field = ''
        if (c !== ',') {
          rows.push(current)
          current = []
        }
      } else if (c !== '\r') field += c
    }
  }
  if (field || current.length) {
    current.push(field.trim())
    rows.push(current)
  }
  return rows
}

function csvToArchive(csvPath, outPath) {
  const text = readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(text)
  if (rows.length < 2) {
    console.error('CSV must have header + at least one row')
    process.exit(1)
  }
  const headers = rows[0].map((h) => h.toLowerCase().trim())
  const items = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.every((c) => !c)) continue
    const obj = {}
    headers.forEach((h, j) => {
      obj[h] = row[j] ?? ''
    })
    const lat = parseFloat(obj.lat)
    const lng = parseFloat(obj.lng)
    const year = parseInt(obj.year, 10) || 2024
    const month = parseInt(obj.dt_month, 10) || 1
    const day = parseInt(obj.dt_day, 10) || 1
    const hour = parseInt(obj.dt_hour, 10) || 0
    const minute = parseInt(obj.dt_minute, 10) || 0
    const second = parseInt(obj.dt_second, 10) || 0
    const category = obj.category
      ? obj.category.split('|').map((c) => c.trim()).filter(Boolean)
      : []
    const images = obj.images
      ? obj.images.split('|').map((u) => u.trim()).filter(Boolean)
      : []
    const audioPath = obj.audiorecording?.trim()
    const item = {
      id: String(obj.id ?? i),
      title: obj.title ?? '',
      date: obj.date ?? '',
      year: isNaN(year) ? new Date().getFullYear() : year,
      datetime: {
        year: parseInt(obj.dt_year, 10) || year,
        month: month,
        day: day,
        hour: hour,
        minute: minute,
        second: second,
      },
      coordinates:
        !isNaN(lat) && !isNaN(lng) ? { lat, lng } : null,
      gpsCoordinates: obj.gpscoordinates ?? null,
      category: category.length ? category : [],
      description: obj.description ?? '',
      images,
      video: obj.video?.trim() || null,
      _audioPath: audioPath || null,
      others: { status: obj.status ?? 'Completed' },
    }
    items.push(item)
  }
  const json = JSON.stringify(items, null, 2)
  const js = `/**
 * Archive items - generated from archive.csv
 * Edit archive.csv in Google Sheets, export as CSV, then run: npm run data:import
 */

export const archive = ${json
    .replace(/"_audioPath": "([^"]*)"/g, (_, path) =>
      path ? `"audioRecording": new URL('./${path}', import.meta.url).href` : '"audioRecording": null'
    )
    .replace(/"audioRecording": null/g, '"audioRecording": null')
    .replace(/"_audioPath": null/g, '"audioRecording": null')}
`
  writeFileSync(outPath, js, 'utf-8')
  console.log(`Wrote ${items.length} items to ${outPath}`)
}

const input = process.argv[2] || join(DATA_DIR, 'archive.csv')
const output = process.argv[3] || join(DATA_DIR, 'archive.js')
csvToArchive(input, output)
