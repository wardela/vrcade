import React from 'react';
import styled from 'styled-components';

const CompletionCard = () => {
  return (
    <StyledWrapper>
      <div className="card">
        <div className="card-front">
          <div className="score-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M13.5 0L3 13.5h7.5L10.5 24 21 10.5h-7.5L13.5 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="score-title">Account Score</p>
          <p className="score-percent">74%</p>
        </div>

        <div className="card-back">
          <p className="score-tip">Reassess <strong className='text-[#5ce1e6]'>SQL</strong> to get a better score.</p>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  height: 100%;
  width: 100%;

  .card {
    width: 100%;
    height: 100%;
    border-radius: 16px;
    border: .25px solid #5ce1e6;
    background: linear-gradient(to bottom right, #03102f, #000000, #03102f);
    box-shadow: 0px 10px 20px rgba(92, 225, 230, 0.2);
    padding: 1.2em;
    position: relative;
    overflow: hidden;
    transition: background-color 0.8s ease-in-out;
  }

  .card-front {
    position: absolute;
    inset: 0;
    padding: 1.2em;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4em;
    text-align: center;
    transition: transform 0.8s cubic-bezier(0.785, 0.135, 0.150, 0.860);
  }

  .card-back {
    position: absolute;
    inset: 0;
    padding: 1.5em;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    transform: translateX(120%);
    transition: transform 0.8s cubic-bezier(0.785, 0.135, 0.150, 0.860);
  }

  .card:hover .card-front {
    transform: translateX(-100%);
  }

  .card:hover .card-back {
    transform: translateX(0);
  }

  .score-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 0.3em;
  }

  .score-icon svg {
    width: 2em;
    height: 2em;
    color: #5ce1e6;
    filter: drop-shadow(0 0 4px #5ce1e6);
    margin-top: 0.2em;
  }

  .score-title {
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    color: #5ce1e6;
    letter-spacing: 0.5px;
  }

  .score-percent {
    font-size: 3.3rem;
    font-weight: bold;
    color: #ffffff;
    text-shadow: 0 0 12px #5ce1e6;
    margin-top: -0.2em;
  }

  .score-tip {
    font-size: 0.9rem;
    opacity: 0.85;
    line-height: 1.5;
    max-width: 90%;
    color: #e0f7fa;
  }
`;

export default CompletionCard;
