import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationList from '../features/notification/NotificationList';
import NotificationModal from '../features/notification/NotificationModal';
import NotificationView from '../features/notification/NotificationView';

const NotificationPage = () => {
    const navigate = useNavigate();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [showNewConversation, setShowNewConversation] = useState(false);

    return (
        <>

            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '70px',
                backgroundColor: '#374640',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 30px',
                zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <img
                        src="/image/SunLogo.svg"
                        alt='Atlas Logo'
                        style={{ height: '40px' }}
                    />
                    <h1 style={{
                        color: 'white',
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: '600'
                    }}>
                        Atlas
                    </h1>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        onClick={() => navigate('/Dashboard')}
                        style={{
                            color: 'white',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        }}
                    >
                        🏠 Dashboard
                    </button>
                </div>
            </div>

            {/* Contenu principal */}
            <div style={{
                height: '100vh',
                backgroundColor: '#ECF3F0',
                paddingTop: '70px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Titre centré */}
                <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: '#ECF3F0'
                }}>
                    <h1 style={{
                        color: '#374640',
                        margin: '0 0 8px 0',
                        fontSize: '28px',
                        fontWeight: '600'
                    }}>
                        💬 Messagerie Privée
                    </h1>
                    <p style={{
                        color: '#6b7280',
                        margin: 0,
                        fontSize: '16px'
                    }}>
                        Échangez des messages privés avec les autres membres d'Atlas
                    </p>
                </div>

                {/* Interface de messagerie */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    maxWidth: '1400px',
                    margin: '0 auto',
                    width: '100%',
                    backgroundColor: 'white',
                    boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                    borderRadius: '12px 12px 0 0',
                    overflow: 'hidden'
                }}>
                    {/* Liste des notifications/conversations */}
                    <NotificationList
                        selectedConversation={selectedConversation}
                        onSelectConversation={setSelectedConversation}
                        onNewConversation={() => setShowNewConversation(true)}
                    />

                    {/* Vue de conversation */}
                    <NotificationView
                        conversation={selectedConversation}
                        onBack={() => setSelectedConversation(null)}
                    />
                </div>
            </div>

            {/* Modal nouvelle conversation */}
            {showNewConversation && (
                <NotificationModal
                    onClose={() => setShowNewConversation(false)}
                    onSuccess={() => {
                        setShowNewConversation(false);
                    }}
                />
            )}
        </>
    );
};

export default NotificationPage;