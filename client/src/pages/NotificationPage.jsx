import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu, X } from 'lucide-react';
import NotificationList from '../features/notification/NotificationList';
import NotificationModal from '../features/notification/NotificationModal';
import NotificationView from '../features/notification/NotificationView';

const NotificationPage = () => {
    const navigate = useNavigate();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Hook pour détecter la taille d'écran
    const [screenSize, setScreenSize] = useState({
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024
    });

    // Effet pour gérer le resize
    useEffect(() => {
        const handleResize = () => {
            setScreenSize({
                isMobile: window.innerWidth < 768,
                isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
                isDesktop: window.innerWidth >= 1024
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Sur mobile, fermer la liste quand on sélectionne une conversation
    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        if (screenSize.isMobile) {
            setIsMobileMenuOpen(false);
        }
    };

    // Retour à la liste sur mobile
    const handleBackToList = () => {
        setSelectedConversation(null);
        if (screenSize.isMobile) {
            setIsMobileMenuOpen(true);
        }
    };

    return (
        <>
            {/* Navbar comme ProfilePage */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: screenSize.isMobile ? '60px' : '70px',
                backgroundColor: '#374640',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 clamp(15px, 4vw, 30px)',
                zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                {/* Logo */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <img
                        src="/image/SunLogo.svg"
                        alt='Atlas Logo'
                        style={{ height: 'clamp(32px, 6vw, 40px)' }}
                    />
                </div>

                {/* Bouton Dashboard avec style blanc qui devient doré au hover */}
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        onClick={() => navigate('/Dashboard')}
                        style={{
                            color: 'white',
                            background: 'none',
                            border: '1px dashed white',
                            borderRadius: '25px',
                            padding: 'clamp(6px, 2vw, 8px) clamp(12px, 3vw, 16px)',
                            fontSize: 'clamp(12px, 2.5vw, 14px)',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = '#F3CB23';
                            e.target.style.borderColor = '#F3CB23';
                            e.target.style.color = '#374640';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.borderColor = 'white';
                            e.target.style.color = 'white';
                        }}
                    >
                        ✦ Dashboard
                    </button>
                </div>
            </div>

            {/* Contenu principal responsive */}
            <div style={{
                height: '100vh',
                backgroundColor: '#ECF3F0',
                paddingTop: screenSize.isMobile ? '60px' : '70px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Titre centré - adaptatif */}
                {!screenSize.isMobile && (
                    <div style={{
                        textAlign: 'center',
                        padding: 'clamp(20px, 5vw, 30px)',
                        backgroundColor: '#ECF3F0'
                    }}>
                        <h1 style={{
                            color: '#374640',
                            margin: '0 0 8px 0',
                            fontSize: 'clamp(24px, 6vw, 32px)',
                            fontWeight: '600'
                        }}>
                            💬 Messagerie Privée
                        </h1>
                        <p style={{
                            color: '#6b7280',
                            margin: 0,
                            fontSize: 'clamp(14px, 3vw, 16px)'
                        }}>
                            Échangez des messages privés avec les autres membres d'Atlas
                        </p>
                    </div>
                )}

                {/* Interface de messagerie responsive */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    maxWidth: screenSize.isMobile ? '100%' : '1400px',
                    margin: '0 auto',
                    width: '100%',
                    backgroundColor: 'white',
                    boxShadow: screenSize.isMobile ? 'none' : '0 0 20px rgba(0,0,0,0.1)',
                    borderRadius: screenSize.isMobile ? '0' : '12px 12px 0 0',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    {/* Mobile: Affichage conditionnel */}
                    {screenSize.isMobile ? (
                        <>
                            {/* Liste des conversations (mobile) */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: selectedConversation ? '-100%' : '0%',
                                width: '100%',
                                height: '100%',
                                transition: 'left 0.3s ease-in-out',
                                backgroundColor: 'white',
                                zIndex: 2
                            }}>
                                <NotificationList
                                    selectedConversation={selectedConversation}
                                    onSelectConversation={handleSelectConversation}
                                    onNewConversation={() => setShowNewConversation(true)}
                                    isMobile={true}
                                    screenSize={screenSize}
                                />
                            </div>

                            {/* Vue de conversation (mobile) */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: selectedConversation ? '0%' : '100%',
                                width: '100%',
                                height: '100%',
                                transition: 'left 0.3s ease-in-out',
                                backgroundColor: 'white',
                                zIndex: 1
                            }}>
                                <NotificationView
                                    conversation={selectedConversation}
                                    onBack={handleBackToList}
                                    isMobile={true}
                                    screenSize={screenSize}
                                />
                            </div>
                        </>
                    ) : (
                        /* Desktop/Tablet: Affichage côte à côte */
                        <>
                            <NotificationList
                                selectedConversation={selectedConversation}
                                onSelectConversation={handleSelectConversation}
                                onNewConversation={() => setShowNewConversation(true)}
                                isMobile={false}
                                screenSize={screenSize}
                            />

                            <NotificationView
                                conversation={selectedConversation}
                                onBack={handleBackToList}
                                isMobile={false}
                                screenSize={screenSize}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Modal nouvelle conversation - responsive */}
            {showNewConversation && (
                <NotificationModal
                    onClose={() => setShowNewConversation(false)}
                    onSuccess={() => {
                        setShowNewConversation(false);
                    }}
                    screenSize={screenSize}
                />
            )}
        </>
    );
};

export default NotificationPage;