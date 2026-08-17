import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import StyleReview from './StyleReview'
import './style-review.css'

createRoot(document.getElementById('style-review-root')!).render(
  <StrictMode><StyleReview /></StrictMode>,
)
