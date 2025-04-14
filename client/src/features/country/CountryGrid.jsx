import React from 'react';
import { useGetAllCountriesQuery } from '../../api/endpoints/countries';
import CountryCard from './CountryCard';

const CountryGrid = () => {
    const { data: countries = [], isLoading } = useGetAllCountriesQuery();

    if (isLoading) return <p>Chargement...</p>;

    return (
        <div className="grid grid-cols-3 gap-6">
            {countries.map((country) => (
                <CountryCard key={country.id} country={country} />
            ))}
        </div>
    );
};

export default CountryGrid;