import { Outlet } from 'react-router'
import './App.css'
import Navbar from './components/NavBar'

function App() {

  return (
    <>
    <Navbar />
    <main className='min-h-screen'>
      <Outlet />
    </main>
    <div>Footer</div>
    </>
  )
}

export default App
