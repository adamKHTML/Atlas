import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/slices/authSlice';
import {
    useGetAllUsersQuery,
    useGetUsersStatsQuery,
    useBanUserMutation,
    useUnbanUserMutation
} from '../api/endpoints/admin/gestuser';
import BanUserModal from '../features/gestuser/BanUserModal';
import ChangeRoleModal from '../features/gestuser/ChangeRoleModal';

const UserManagementPage = () => {
    const navigate = useNavigate();
    const currentUser = useSelector(selectUser);

    // États locaux
    const [selectedUser, setSelectedUser] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showBanModal, setShowBanModal] = useState(false);
    const [filters, setFilters] = useState({
        role: '',
        status: '',
        search: '',
        page: 1
    });

    // Mutations
    const [banUser] = useBanUserMutation();
    const [unbanUser] = useUnbanUserMutation();

    // Requêtes
    const { data: usersData, isLoading: usersLoading, refetch } = useGetAllUsersQuery({
        page: filters.page,
        limit: 20,
        role: filters.role || null,
        status: filters.status || null,
        search: filters.search || null
    });

    const { data: statsData, isLoading: statsLoading } = useGetUsersStatsQuery();

    // Vérifier les permissions
    const canManageUsers = currentUser && (
        currentUser.roles.includes('ROLE_ADMIN') ||
        currentUser.roles.includes('ROLE_MODERATOR')
    );

    const canManageRoles = currentUser && currentUser.roles.includes('ROLE_ADMIN');

    useEffect(() => {
        if (!canManageUsers) {
            navigate('/Dashboard');
        }
    }, [canManageUsers, navigate]);

    // Rafraîchir automatiquement
    useEffect(() => {
        const interval = setInterval(() => {
            refetch();
        }, 10000);
        return () => clearInterval(interval);
    }, [refetch]);

    const handleBanUser = (user) => {
        setSelectedUser(user);
        setShowBanModal(true);
    };

    const handleUnbanUser = async (user) => {
        if (window.confirm(`Êtes-vous sûr de vouloir débannir ${user.pseudo} ?`)) {
            try {
                await unbanUser(user.id).unwrap();
                refetch();
            } catch (error) {
                console.error('Erreur débannissement:', error);
                alert('Erreur lors du débannissement');
            }
        }
    };

    const handleChangeRole = (user) => {
        setSelectedUser(user);
        setShowRoleModal(true);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 1 // Reset page on filter change
        }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({
            ...prev,
            page: newPage
        }));
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'Administrateur': return '#dc2626';
            case 'Modérateur': return '#ea580c';
            case 'Voyageur': return '#2563eb';
            default: return '#6b7280';
        }
    };

    const getStatusColor = (isBanned) => {
        return isBanned ? '#ef4444' : '#10b981';
    };

    if (!canManageUsers) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ECF3F0'
            }}>
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚫</div>
                    <h2 style={{ color: '#374640', marginBottom: '12px' }}>Accès refusé</h2>
                    <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                        Vous n'avez pas les permissions pour accéder à cette page.
                    </p>
                    <button
                        onClick={() => navigate('/Dashboard')}
                        style={{
                            backgroundColor: '#374640',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            cursor: 'pointer'
                        }}
                    >
                        Retour au Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Navbar */}
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
                        Atlas - Gestion des utilisateurs
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
                minHeight: '100vh',
                backgroundColor: '#ECF3F0',
                paddingTop: '70px'
            }}>
                {/* Header avec titre et statistiques */}
                <div style={{
                    padding: '30px',
                    textAlign: 'center',
                    backgroundColor: '#ECF3F0'
                }}>
                    <h1 style={{
                        color: '#374640',
                        margin: '0 0 8px 0',
                        fontSize: '32px',
                        fontWeight: '600'
                    }}>
                        👥 Gestion des Utilisateurs
                    </h1>
                    <p style={{
                        color: '#6b7280',
                        margin: '0 0 24px 0',
                        fontSize: '16px'
                    }}>
                        {canManageRoles ? 'Administration complète' : 'Modération'} des membres d'Atlas
                    </p>

                    {/* Statistiques */}
                    {!statsLoading && statsData && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px',
                            maxWidth: '1000px',
                            margin: '0 auto'
                        }}>
                            <div style={{
                                backgroundColor: 'white',
                                padding: '20px',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                border: '2px solid #10b981'
                            }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                                    {statsData.total_users}
                                </div>
                                <div style={{ fontSize: '14px', color: '#6b7280' }}>Total utilisateurs</div>
                            </div>

                            <div style={{
                                backgroundColor: 'white',
                                padding: '20px',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                border: '2px solid #3b82f6'
                            }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                                    {statsData.active_users}
                                </div>
                                <div style={{ fontSize: '14px', color: '#6b7280' }}>Utilisateurs actifs</div>
                            </div>

                            <div style={{
                                backgroundColor: 'white',
                                padding: '20px',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                border: '2px solid #ef4444'
                            }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                                    {statsData.banned_users}
                                </div>
                                <div style={{ fontSize: '14px', color: '#6b7280' }}>Utilisateurs bannis</div>
                            </div>

                            <div style={{
                                backgroundColor: 'white',
                                padding: '20px',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                border: '2px solid #f59e0b'
                            }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                                    {statsData.verified_users}
                                </div>
                                <div style={{ fontSize: '14px', color: '#6b7280' }}>Comptes vérifiés</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Zone de filtres */}
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '0 30px 20px 30px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px',
                            alignItems: 'end'
                        }}>
                            {/* Recherche */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '600',
                                    color: '#374640',
                                    fontSize: '14px'
                                }}>
                                    🔍 Rechercher
                                </label>
                                <input
                                    type="text"
                                    placeholder="Pseudo, nom, email..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#374640';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e5e7eb';
                                    }}
                                />
                            </div>

                            {/* Filtre par rôle */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '600',
                                    color: '#374640',
                                    fontSize: '14px'
                                }}>
                                    👑 Rôle
                                </label>
                                <select
                                    value={filters.role}
                                    onChange={(e) => handleFilterChange('role', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        backgroundColor: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Tous les rôles</option>
                                    <option value="ROLE_USER">Utilisateurs</option>
                                    <option value="ROLE_TRAVELER">Voyageurs</option>
                                    <option value="ROLE_MODERATOR">Modérateurs</option>
                                    <option value="ROLE_ADMIN">Administrateurs</option>
                                </select>
                            </div>

                            {/* Filtre par statut */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontWeight: '600',
                                    color: '#374640',
                                    fontSize: '14px'
                                }}>
                                    📊 Statut
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        backgroundColor: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Tous les statuts</option>
                                    <option value="active">Actifs</option>
                                    <option value="banned">Bannis</option>
                                </select>
                            </div>

                            {/* Bouton reset */}
                            <div>
                                <button
                                    onClick={() => setFilters({ role: '', status: '', search: '', page: 1 })}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#f3f4f6',
                                        color: '#374640',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.backgroundColor = '#e5e7eb';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.backgroundColor = '#f3f4f6';
                                    }}
                                >
                                    🔄 Réinitialiser
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Liste des utilisateurs */}
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '0 30px 30px 30px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}>
                        {usersLoading ? (
                            <div style={{
                                padding: '60px',
                                textAlign: 'center',
                                color: '#6b7280'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                                <p>Chargement des utilisateurs...</p>
                            </div>
                        ) : !usersData?.users?.length ? (
                            <div style={{
                                padding: '60px',
                                textAlign: 'center',
                                color: '#6b7280'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
                                <p>Aucun utilisateur trouvé</p>
                            </div>
                        ) : (
                            <>
                                {/* Header du tableau */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '80px 1fr 150px 120px 100px 200px',
                                    gap: '16px',
                                    padding: '20px',
                                    backgroundColor: '#f9fafb',
                                    borderBottom: '1px solid #e5e7eb',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#374640'
                                }}>
                                    <div>Avatar</div>
                                    <div>Utilisateur</div>
                                    <div>Rôle</div>
                                    <div>Statut</div>
                                    <div>Ban</div>
                                    <div>Actions</div>
                                </div>

                                {/* Liste des utilisateurs */}
                                {usersData.users.map((user) => (
                                    <div
                                        key={user.id}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '80px 1fr 150px 120px 100px 200px',
                                            gap: '16px',
                                            padding: '20px',
                                            borderBottom: '1px solid #f3f4f6',
                                            alignItems: 'center',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f9fafb';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div>
                                            {user.profile_picture ? (
                                                <img
                                                    src={user.profile_picture}
                                                    alt={user.pseudo}
                                                    style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
                                                        border: '2px solid #ECF3F0'
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #374640 0%, #10b981 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '18px',
                                                    color: 'white',
                                                    fontWeight: '600'
                                                }}>
                                                    {user.pseudo.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        {/* Informations utilisateur */}
                                        <div>
                                            <div style={{
                                                fontWeight: '600',
                                                color: '#374640',
                                                fontSize: '15px',
                                                marginBottom: '4px'
                                            }}>
                                                {user.firstname} {user.lastname}
                                            </div>
                                            <div style={{
                                                fontSize: '13px',
                                                color: '#6b7280',
                                                marginBottom: '2px'
                                            }}>
                                                @{user.pseudo}
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#9ca3af'
                                            }}>
                                                {user.email}
                                            </div>
                                        </div>

                                        {/* Rôle */}
                                        <div>
                                            <span style={{
                                                backgroundColor: getRoleColor(user.main_role),
                                                color: 'white',
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>
                                                {user.main_role}
                                            </span>
                                        </div>

                                        {/* Statut */}
                                        <div>
                                            <span style={{
                                                backgroundColor: getStatusColor(user.is_banned),
                                                color: 'white',
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>
                                                {user.is_banned ? 'Banni' : 'Actif'}
                                            </span>
                                        </div>

                                        {/* Info ban */}
                                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                            {user.current_ban ? (
                                                <div>
                                                    <div style={{ fontWeight: '600', color: '#ef4444' }}>
                                                        {user.current_ban.days_remaining}j restants
                                                    </div>
                                                    <div title={user.current_ban.reason}>
                                                        {user.current_ban.reason.length > 20
                                                            ? user.current_ban.reason.substring(0, 20) + '...'
                                                            : user.current_ban.reason}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#10b981' }}>-</span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div style={{
                                            display: 'flex',
                                            gap: '8px',
                                            flexWrap: 'wrap'
                                        }}>
                                            {user.is_banned ? (
                                                <button
                                                    onClick={() => handleUnbanUser(user)}
                                                    style={{
                                                        backgroundColor: '#10b981',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        padding: '6px 12px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.target.style.backgroundColor = '#059669';
                                                        e.target.style.transform = 'scale(1.05)';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.target.style.backgroundColor = '#10b981';
                                                        e.target.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    ✅ Débannir
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleBanUser(user)}
                                                    style={{
                                                        backgroundColor: '#ef4444',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        padding: '6px 12px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.target.style.backgroundColor = '#dc2626';
                                                        e.target.style.transform = 'scale(1.05)';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.target.style.backgroundColor = '#ef4444';
                                                        e.target.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    🚫 Bannir
                                                </button>
                                            )}

                                            {canManageRoles && (
                                                <button
                                                    onClick={() => handleChangeRole(user)}
                                                    style={{
                                                        backgroundColor: '#3b82f6',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        padding: '6px 12px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.target.style.backgroundColor = '#2563eb';
                                                        e.target.style.transform = 'scale(1.05)';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.target.style.backgroundColor = '#3b82f6';
                                                        e.target.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    👑 Rôle
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* Pagination */}
                        {usersData?.pagination && usersData.pagination.pages > 1 && (
                            <div style={{
                                padding: '20px',
                                borderTop: '1px solid #e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{
                                    fontSize: '14px',
                                    color: '#6b7280'
                                }}>
                                    Page {usersData.pagination.page} sur {usersData.pagination.pages}
                                    ({usersData.pagination.total} utilisateurs)
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: '8px'
                                }}>
                                    <button
                                        onClick={() => handlePageChange(filters.page - 1)}
                                        disabled={filters.page <= 1}
                                        style={{
                                            backgroundColor: filters.page <= 1 ? '#f3f4f6' : '#374640',
                                            color: filters.page <= 1 ? '#9ca3af' : 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px 12px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: filters.page <= 1 ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        ← Précédent
                                    </button>

                                    <button
                                        onClick={() => handlePageChange(filters.page + 1)}
                                        disabled={filters.page >= usersData.pagination.pages}
                                        style={{
                                            backgroundColor: filters.page >= usersData.pagination.pages ? '#f3f4f6' : '#374640',
                                            color: filters.page >= usersData.pagination.pages ? '#9ca3af' : 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px 12px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: filters.page >= usersData.pagination.pages ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Suivant →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modales */}
            {showRoleModal && selectedUser && (
                <ChangeRoleModal
                    user={selectedUser}
                    onClose={() => {
                        setShowRoleModal(false);
                        setSelectedUser(null);
                    }}
                    onSuccess={() => {
                        setShowRoleModal(false);
                        setSelectedUser(null);
                        refetch();
                    }}
                />
            )}

            {showBanModal && selectedUser && (
                <BanUserModal
                    user={selectedUser}
                    onClose={() => {
                        setShowBanModal(false);
                        setSelectedUser(null);
                    }}
                    onSuccess={() => {
                        setShowBanModal(false);
                        setSelectedUser(null);
                        refetch();
                    }}
                />
            )}
        </>
    );
};

export default UserManagementPage;