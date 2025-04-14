import React from 'react';
import CountryGrid from '../features/country/CountryGrid';


function Home() {
    return (
        <div className="home-container">
            {/* Header/Hero Section */}
            <div className="hero-section">
                <div className="header-nav">
                    <img
                        src="/image/SunLogo.svg"
                        alt='Solar Atlas Logo'
                        className="logo" />
                    <div className="contact-link">Register/Log in</div>
                </div>
                <img
                    src="/image/Atlashome.svg"
                    alt="Vue panoramique de montagnes côtières"
                    className="hero-image"
                />
            </div>

            {/* Featured Images Grid */}
            <div className="featured-section">
                <div className="featured-grid">
                    <div className="featured-item big-image">
                        <img
                            src="/image/Inspirehome.svg"
                            alt="Terrasses agricoles avec parapluie rouge"
                            className="grid-image"
                        />
                    </div>
                    <div className="featured-item big-image">
                        <img
                            src="/image/Ricefieldhome.svg"
                            alt="Deux personnes se tenant la main devant un paysage côtier"
                            className="grid-image"
                        />
                    </div>
                    <div className="featured-item big-image">
                        <img
                            src="/image/Toscanahome2.svg"
                            alt="Collines toscanes au coucher du soleil"
                            className="grid-image"
                        />
                    </div>
                </div>

                {/* Title Section */}
                <div className="title-section">
                    <div className="title-label">Titre</div>
                    <h1 className="main-title">Liste des Pays</h1>
                    <div className="title-divider"></div>
                </div>

                {/* Gallery Grid */}
                <div className="gallery-grid">
                    <div className="gallery-item">
                        <img src="/api/placeholder/250/180" alt="Thumbnail 1" className="gallery-image" />
                    </div>
                    <div className="gallery-item">
                        <img src="/api/placeholder/250/180" alt="Thumbnail 2" className="gallery-image" />
                    </div>
                    <div className="gallery-item">
                        <img src="/api/placeholder/250/180" alt="Thumbnail 3" className="gallery-image" />
                    </div>
                    <div className="gallery-item">
                        <img src="/api/placeholder/250/180" alt="Thumbnail 4" className="gallery-image" />
                    </div>
                    <div className="gallery-item">
                        <img src="/api/placeholder/250/180" alt="Thumbnail 5" className="gallery-image" />
                    </div>
                    <div className="gallery-item">
                        <img src="/api/placeholder/250/180" alt="Thumbnail 6" className="gallery-image" />
                    </div>
                    <div className="gallery-item">
                        <img src="/api/placeholder/250/180" alt="Thumbnail 7" className="gallery-image" />
                    </div>
                </div>
            </div>

            {/* Contact Footer */}
            <div className="contact-footer">
                <h2 className="footer-heading">Contact</h2>
                <div className="footer-mail">Réseaux</div>
            </div>
        </div>
    );
}

export default Home;