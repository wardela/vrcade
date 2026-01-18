import React from 'react';
import styled from 'styled-components';

const ProfileCard = () => {
  // Dummy candidate info (you can later pass these via props)
  const candidate = {
    name: "Mohammad Al Omari",
    title: "Software Engineer",
    age: 23,
    experience: 3,
    location: "Amman, Jordan",
    education: "B.Sc. Computer Engineering",
  };

  return (
<StyledWrapper>
  <div className="e-card playing">
    <div className="image" />
    <div className="wave" />
    <div className="wave" />
    <div className="wave" />

    <div className="infotop">
      <div className="icon-wrap">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </div>

      <h3 className="name">Mohammad Al Omari</h3>
      <p className="title">Software Engineer</p>

      <div className="info-section">
        <div className="info-row">
          <span className="label">Age:</span>
          <span className="value">23</span>
        </div>
        <div className="info-row">
          <span className="label">Experience:</span>
          <span className="value">3 years</span>
        </div>
        <div className="info-row">
          <span className="label">Location:</span>
          <span className="value">Amman, Jordan</span>
        </div>
        <div className="info-row">
          <span className="label">Education:</span>
          <span className="value">B.Sc. Computer Engineering</span>
        </div>
      </div>
    </div>
  </div>
</StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  height: 100%;
  width: 100%;

.e-card {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(12px);
  box-shadow: 0px 8px 28px -9px rgba(0,0,0,0.45);
  position: relative;
  border-radius: 16px;
  overflow: hidden;
}

  .wave {
    position: absolute;
    width: 540px;
    height: 700px;
    opacity: 0.6;
    left: 0;
    top: 0;
    margin-left: -50%;
    margin-top: -70%;
    background: linear-gradient(744deg,#af40ff,#5b42f3 60%,#00ddeb);
    border-radius: 40%;
    animation: wave 55s infinite linear;
  }

.playing .wave {
  animation: wave 45s infinite linear; /* slowed down */
}

.playing .wave:nth-child(2) {
  animation-duration: 55s;
}
  .wave:nth-child(2) {
    animation-duration: 50s;
    top: 210px;
  }
.playing .wave:nth-child(3) {
  animation-duration: 65s;
}
  .wave:nth-child(3) {
    animation-duration: 45s;
    top: 210px;
  }

.icon-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 0.8em;
}

.icon {
  width: 3.2em;
  height: 3.2em;
  color: white;
}

.infotop {
  position: absolute;
  top: 1.4em; /* ⬅️ updated from 6em */
  left: 0;
  right: 0;
  padding: 0 1em;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  text-align: center;
}


.name {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.2em;
}

.title {
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0.85;
  margin-bottom: 1em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

  .details {
    margin-top: 1.2em;
    font-size: 12px;
    line-height: 1.4;
    opacity: 0.9;
  }

  .info-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  font-size: 0.85rem;
  opacity: 0.95;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center; /* ✅ fixes baseline alignment */
  padding: 0.2em 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.label {
  font-weight: 600;
  opacity: 0.95;
  text-align: left;
  min-width: 6em;
}

.value {
  opacity: 0.9;
  text-align: right;
}

  @keyframes wave {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export default ProfileCard;
