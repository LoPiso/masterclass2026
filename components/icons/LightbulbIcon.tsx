import React from 'react';

const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M9 18h6" />
        <path d="M10 21h4" />
        <path d="M12 3a6 6 0 0 0 -6 6c0 2.454 .733 3.65 1.559 4.682a.6 .6 0 0 0 .561 .318h7.76a.6 .6 0 0 0 .561 -.318c.826 -1.032 1.559 -2.228 1.559 -4.682a6 6 0 0 0 -6 -6z" />
    </svg>
);

export default LightbulbIcon;