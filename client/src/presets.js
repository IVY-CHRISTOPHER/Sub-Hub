// Shared lists and helpers used by the forms and the dashboard.

// Popular services with a typical price. Picking one in the form fills in the details for you.
// Prices are rough estimates and can be changed by the user.
export const PRESETS = [
  { name: 'Netflix', price: 15.49, category: 'Streaming' },
  { name: 'HBO Max', price: 16.99, category: 'Streaming' },
  { name: 'Disney+', price: 13.99, category: 'Streaming' },
  { name: 'Hulu', price: 9.99, category: 'Streaming' },
  { name: 'Amazon Prime', price: 14.99, category: 'Shopping' },
  { name: 'Spotify', price: 11.99, category: 'Music' },
  { name: 'Apple Music', price: 10.99, category: 'Music' },
  { name: 'YouTube Premium', price: 13.99, category: 'Streaming' },
  { name: 'iCloud+', price: 2.99, category: 'Cloud' },
  { name: 'Xbox Game Pass', price: 16.99, category: 'Gaming' },
]

// The category choices shown in the dropdown menu.
export const CATEGORIES = ['Streaming', 'Music', 'Gaming', 'Cloud', 'Shopping', 'Fitness', 'News', 'Software', 'Other']

// Turn a number like 15.49 into nicely formatted money text like "$15.49".
export const money = (n, currency = 'USD') =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n)
