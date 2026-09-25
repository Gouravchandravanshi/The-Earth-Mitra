// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import heroImg from './assets/hero.png'
// import './App.css'

// function App() {
  

//   return (
//     <>
//       <section className='b' id="center">
//         hello 
        
//       </section>


//       <section id="spacer"></section>
//     </>
//   )
// }

// export default App



import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<div className="text-green-600 bg-green-100 text-2xl p-8">🌱 Earth Mitra is live!</div>} />
    </Routes>
  );
}

export default App;