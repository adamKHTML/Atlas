import React, { useState } from 'react';

const Dashboard = () => {
    const [userData, setUserData] = useState({
        name: 'Emma Laurent',
        recentActivity: [
            { id: 1, title: 'Voyage au Maroc', date: '15 avril 2025', category: 'TRAVELS' },
            { id: 2, title: 'Recette de tajine', date: '2 avril 2025', category: 'COOKING' },
            { id: 3, title: 'Méditation du matin', date: '28 mars 2025', category: 'INSPIRE' },
        ],
        savedArticles: 12,
        followers: 28
    });

    return (
        <>
            <div className="dashboard-navbar">
                <img
                    src="/image/SunLogo.svg"
                    alt='Solar Atlas Logo'
                    className="logo" />
                <div style={{ display: 'flex', gap: '20px' }}>
                    <a href="#" className="nav-button" style={{ color: 'white', borderColor: 'white' }}>LOGOUT</a>
                </div>
            </div>


            <section className="dashboard-header">
                <div className="header-rounded">
                    <div className="dashboard-background">
                        <img
                            src="/image/DashboardBack.svg"
                            alt='Mountain landscape'
                            className="dashboard-img" />
                    </div>
                    <div className="text-welcome">


                        <h1 style={{ fontStyle: 'Italic', fontSize: '58px', marginBottom: '20px', color: '#F3CB23' }}>
                            BIENVENUE SUR VOTRE ESPACE
                        </h1>
                        <h2 style={{ fontFamily: 'Goblin One, sans-serif', fontSize: '12px', fontWeight: '400', color: '#F3CB23' }}>
                            {userData.name}
                        </h2>

                    </div>
                </div>
            </section>


            <div className="content">
                {/* Dashboard Content */}
                <div className="featured-container" style={{ backgroundColor: 'white', padding: '30px' }}>
                    <div className="title-section" style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h2 className="main-title">TABLEAU DE BORD</h2>
                        <div className="title-divider" style={{ width: '60px', margin: '20px auto' }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '50px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#F3CB23' }}>{userData.savedArticles}</div>
                            <div>Articles sauvegardés</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#F3CB23' }}>{userData.followers}</div>
                            <div>Abonnés</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#F3CB23' }}>7</div>
                            <div>Jours consécutifs</div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="title-section">
                        <h2 className="main-title">ACTIVITÉ RÉCENTE</h2>
                        <div className="title-divider"></div>
                    </div>

                    <div className="gallery-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        {userData.recentActivity.map(activity => (
                            <div key={activity.id} className="gallery-item" style={{
                                height: '240px',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-end',
                                alignItems: 'flex-start',
                                padding: '20px',
                                backgroundColor: '#e0e0e0',
                                color: 'white',
                                backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url("/api/placeholder/400/320")`,
                                backgroundSize: 'cover',
                                borderRadius: '8px'
                            }}>
                                <div style={{
                                    backgroundColor: '#F3CB23',
                                    color: '#1c2a28',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    marginBottom: '10px'
                                }}>
                                    {activity.category}
                                </div>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>{activity.title}</h3>
                                <p style={{ margin: '0', fontSize: '14px' }}>{activity.date}</p>
                            </div>
                        ))}
                    </div>

                    {/* Suggestions Section */}
                    <div className="title-section" style={{ marginTop: '50px' }}>
                        <h2 className="main-title">SUGGESTIONS POUR VOUS</h2>
                        <div className="title-divider"></div>
                    </div>

                    <div className="featured-grid" style={{
                        height: 'auto',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '20px',
                        margin: '0 auto 50px'
                    }}>
                        <div className="featured-item" style={{
                            height: '400px',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            alignItems: 'flex-start',
                            padding: '30px',
                            color: 'white',
                            backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.7)), url("/api/placeholder/400/320")`,
                            backgroundSize: 'cover',
                            borderRadius: '8px'
                        }}>
                            <div style={{
                                backgroundColor: '#F3CB23',
                                color: '#1c2a28',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                marginBottom: '10px'
                            }}>
                                TRAVELS
                            </div>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>Uganda</h3>
                            <button className="submit-button" style={{
                                backgroundColor: 'transparent',
                                color: 'white',
                                borderColor: 'white',
                                marginTop: '20px',
                                alignSelf: 'flex-start'
                            }}>
                                Lire l'article
                            </button>
                        </div>
                        <div className="featured-item" style={{
                            height: '400px',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            alignItems: 'flex-start',
                            padding: '30px',
                            color: 'white',
                            backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.7)), url("/api/placeholder/400/320")`,
                            backgroundSize: 'cover',
                            borderRadius: '8px'
                        }}>
                            <div style={{
                                backgroundColor: '#F3CB23',
                                color: '#1c2a28',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                marginBottom: '10px'
                            }}>
                                INSPIRE
                            </div>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>Jungle</h3>
                            <button className="submit-button" style={{
                                backgroundColor: 'transparent',
                                color: 'white',
                                borderColor: 'white',
                                marginTop: '20px',
                                alignSelf: 'flex-start'
                            }}>
                                Lire l'article
                            </button>
                        </div>
                        <div className="featured-item" style={{
                            height: '400px',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            alignItems: 'flex-start',
                            padding: '30px',
                            color: 'white',
                            backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.7)), url("/api/placeholder/400/320")`,
                            backgroundSize: 'cover',
                            borderRadius: '8px'
                        }}>
                            <div style={{
                                backgroundColor: '#F3CB23',
                                color: '#1c2a28',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                marginBottom: '10px'
                            }}>
                                COOKING
                            </div>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>Refreshing</h3>
                            <button className="submit-button" style={{
                                backgroundColor: 'transparent',
                                color: 'white',
                                borderColor: 'white',
                                marginTop: '20px',
                                alignSelf: 'flex-start'
                            }}>
                                Lire l'article
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Contact Footer */}
            <div className="contact-footer">
                <h2 className="footer-heading">Contact</h2>
                <div className="footer-mail">Réseaux</div>
            </div>


        </>
    );
};

export default Dashboard;