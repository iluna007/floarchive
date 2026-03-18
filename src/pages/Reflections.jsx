export default function Reflections() {
  return (
    <div className="page reflections">
      <h1 className="page-title">Reflections</h1>
      <p className="page-description">
        Personal insights and reflections.
      </p>
      
      {/* Title section - at left margin (outside the width constraint) */}
      <div style={{ 
        marginBottom: '1rem',
        paddingLeft: '2rem',
        paddingRight: '2rem'
      }}>
        <h2 style={{ 
          fontSize: '1.8rem', 
          fontWeight: '600', 
          marginBottom: '0.5rem',
          lineHeight: '1.3',
          color: 'var(--color-text)'
        }}>
          Aerolectrosonic
        </h2>
        <h3 style={{ 
          fontSize: '1.4rem', 
          fontWeight: '400', 
          marginBottom: '0',
          lineHeight: '1.4',
          color: 'var(--color-text-secondary)',
          fontStyle: 'italic'
        }}>
          Listening to Aerial Infrastructure in Palestine–Israel<br />
          Birds as witnesses to airspace governance and ground regimes of access
        </h3>
      </div>
      
      {/* SINGLE CONTAINER for all content with the same width */}
      <div style={{ 
        paddingLeft: '2rem',
        paddingRight: '2rem'
      }}>
        <div style={{
          maxWidth: '100ch',        /* This controls width for ALL content inside */
          marginRight: 'auto'
        }}>
          
          {/* Map image */}
          <div style={{ marginBottom: '2rem' }}>
            <img 
              src="/Map_1.png" 
              alt="Map of the region"
              style={{ 
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}
            />
          </div>
          
          {/* Text paragraphs */}
          <p style={{
            marginBottom: '1.5rem',
            fontSize: '1.2rem',
            lineHeight: '1.8',
            textAlign: 'justify'
          }}>The project began through an investigation into a documented case involving a griffon vulture. The incident caught my attention because it revealed how birds moving through this region are not only part of ecological systems, but also move through highly monitored airspace shaped by sensing technologies and infrastructure.</p>
          
          <p style={{
            marginBottom: '1.5rem',
            fontSize: '1.2rem',
            lineHeight: '1.8',
            textAlign: 'justify'
          }}>Starting from that case, I began tracing the networks surrounding it: conservation monitoring projects, migration research, and the infrastructures used to track birds across the region. Much of the initial information came from online reports, datasets, and archival material, but these sources also pointed toward specific sites and people connected to the work. Following those traces led me to conduct fieldwork across Palestine and Israel. During this process I visited monitoring areas and landscapes along migration routes, recorded bird vocalisations and environmental sound, and carried out interviews with scientists and conservation workers involved in tracking and protecting birds.</p>
          
          {/* Judean Desert image */}
          <div style={{ margin: '2rem 0' }}>
            <img 
              src="/Bird_EMF2.png" 
              alt="Bird EMF"
              style={{ 
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}
            />
          </div>
          
          {/* Remaining text */}
          <p style={{
            marginBottom: '1.5rem',
            fontSize: '1.2rem',
            lineHeight: '1.8',
            textAlign: 'justify'
          }}>While working with the recordings, I initially relied on standard civilian bioacoustic analysis tools. However, when using these tools with recordings made in the field in Palestine, I found that many of them were not always reliable or precise in capturing what I was hearing in the environment. This led me to pay closer attention to the aerial dynamics of the birds themselves — particularly how wing movement, air friction, and flight patterns shape the acoustic traces that appear in the recordings.</p>
          
          <p style={{
            marginBottom: '1.5rem',
            fontSize: '1.2rem',
            lineHeight: '1.8',
            textAlign: 'justify'
          }}>As a result, the research began to shift toward listening not only to vocalisations but also to the broader sonic signatures produced through flight and movement in air. Alongside the field recordings, I analyse the material through spectrogram and spectral listening techniques, which allow these signals to be examined as traces of how birds move and communicate within this shared airspace. The expanded documentary brings together these elements: field recordings, observational footage, acoustic analysis, and fragments of interviews. The clip I will show now is a short extract from this work, which reflects how the research moves between field observation, listening, and the infrastructures that shape this aerial environment. Through a combina􀆟on of landscape footage, recorded tes􀆟mony, and analy􀆟cal visualisa􀆟ons of sound, the work explores how birds of prey - often described historically as observers of the land from above — can be understood as sensing bodies whose presence intersects with contemporary technologies that also scan and measure the sky.
By assembling these different registers of observa􀆟on, the project asks: how do aerial territories emerge as spaces where ecological percep􀆟on, technological systems, and experiences of displacement intersect?</p>
        </div>
      </div>
    </div>
  )
}
