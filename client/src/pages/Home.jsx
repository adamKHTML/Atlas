import React from 'react';
import CountryGrid from '../features/country/CountryGrid';
import { Link } from 'react-router-dom';

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
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/login"
                            className="border border-dashed border-white rounded-full px-5 py-2 inline-flex items-center text-white hover:bg-white/20 transition-colors"
                        >
                            <span className="text-yellow-400 mr-2">✦</span>
                            Connexion
                        </Link>
                        <Link
                            to="/register"
                            className="border border-dashed border-white rounded-full px-5 py-2 inline-flex items-center text-white hover:bg-white/20 transition-colors"
                        >
                            <span className="text-yellow-400 mr-2">✦</span>
                            Inscription
                        </Link>
                    </div>
                </div>
                <img
                    src="/image/Atlashome2.svg"
                    alt="Vue panoramique de montagnes côtières"
                    className="hero-image"
                />
            </div>
            <div className="content">
                <div className="featured-container">
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
                </div>
            </div>
            {/* Featured Images Grid */}
            <div className="featured-section">


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