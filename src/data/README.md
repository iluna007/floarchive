# Archive Data

## Google Sheets workflow

1. Import archive.csv into Google Sheets: File -> Import -> Upload
2. Edit the data in Google Sheets
3. Export: File -> Download -> Comma Separated Values (.csv)
4. Save as archive.csv in this folder
5. Run: npm run data:import

## Column reference

- id, title, date, year, dt_year, dt_month, dt_day, dt_hour, dt_minute, dt_second
- lat, lng, gpsCoordinates
- category (use pipe for multiple: category1|category2)
- description, images (pipe for multiple URLs)
- video, audioRecording (path like audio files/filename.WAV)
- status (Completed, Ongoing)
