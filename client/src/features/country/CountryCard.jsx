import React from 'react';

const CountryCard = ({ country }) => {
    return (
        <div className="bg-gray-200 aspect-square flex items-center justify-center rounded-lg shadow">
            <span className="text-xl font-semibold">{country.name}</span>
        </div>
    );
};

export default CountryCard;