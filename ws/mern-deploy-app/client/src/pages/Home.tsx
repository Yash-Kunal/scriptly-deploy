import React from 'react';

const Home: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold">Welcome to the MERN Application</h1>
            <p className="mt-4 text-lg">This is the home page of your full-stack application.</p>
        </div>
    );
};

export default Home;