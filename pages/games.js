import React from 'react';

const Games = () => {
  return (
    <div>
      Redirecting to Golden Games...
    </div>
  );
}

export async function getServerSideProps(context) {
  context.res.writeHead(307, { Location: '/golden-era-gaming' });
  context.res.end();
  return { props: {} };
}

export default Games;