import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import polygonLogo from '../assets/polygonlogo.svg';
import ethLogo from '../assets/ethlogo.svg';
import { networks } from '../utils/networks';
import { ethers } from 'ethers';
import SetOffABI from '../utils/setoff.json';
import { Link } from 'react-router-dom';

const CONTRACT_ADDRESS = '0x26CB838DBf7ff7B3B3aACCd0375F0A8EA75F5B2f';

const Domain = () => {
  const [network, setNetwork] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [loans, setLoans] = useState([]); // Store loans here



  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMask -> https://metamask.io/');
        return;
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      console.log('Connected', accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log('Make sure you have metamask!');
      return;
    } else {
      console.log('We have the ethereum object', ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log('Found an authorized account:', account);
      setCurrentAccount(account);
    } else {
      console.log('No authorized account found');
    }

    const chainId = await ethereum.request({ method: 'eth_chainId' });
    const networkName = networks[chainId] || 'Unknown Network';
    console.log(networkName);
    setNetwork(networkName);

    ethereum.on('chainChanged', handleChainChanged);

    function handleChainChanged(_chainId) {
      window.location.reload();
    }
  };

  const fetchListedLoans = async () => {
    try {
      if (!currentAccount) return;

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const setOffContract = new ethers.Contract(
        CONTRACT_ADDRESS, // Replace with your contract address
        SetOffABI.abi,
        signer
      );

      console.log('Fetching listed loans...');
      const loans = await setOffContract.getListedLoans();
      console.log('Listed loans:', loans);
      console.log('Listed loans:', loans);
      setLoans(loans); // Store the loans in state
    } catch (error) {
      console.log('Error fetching listed loans:', error);
    }
  };

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xe705' }],
        });
      } catch (error) {
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0xe705',
                  chainName: 'Linea Sepolia Testnet',
                  rpcUrls: ['https://linea-sepolia.infura.io/v3/'],
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  blockExplorerUrls: ['https://sepolia.lineascan.build/'],
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      alert(
        'MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html'
      );
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    fetchListedLoans(); // Fetch loans when the component loads
  }, [currentAccount]);

  return (
    <div className='text-center h-screen bg-darkGray w-full'>
      <header className="flex w-full bg-lightGray fixed justify-between p-[0.75rem] z-50">
        <div className="flex items-center text-left ml-10">
          <Link to="/">
            <p className="text-4xl font-bold text-peach cursor-pointer">
              Set Off
            </p>
          </Link>
        </div>
        <div className="flex rounded-lg px-5 py-3 mr-10 mt-2 gap-4">
          <Link
            to="/marketplace"
            className="h-12 bg-beige text-textGreen font-bold rounded-lg px-8 py-3 animate-gradient-animation"
          >
            <p>Marketplace</p>
          </Link>
          <Link
            to="/dashboard"
            className="h-12 bg-beige text-textGreen font-bold rounded-lg px-8 py-3 animate-gradient-animation"
          >
            <p>Dashboard</p>
          </Link>
          <div className="flex flex-col items-center mx-auto max-w-lg">
            <button
              onClick={connectWallet}
              className="bg-beige text-textGreen font-bold flex px-8 py-3 rounded-lg"
            >
              {currentAccount ? 'Connected' : 'Connect Wallet'}
            </button>
          </div>
          <div className="bg-beige text-textGreen font-bold flex px-8 py-3 rounded-lg">
            {network === "Linea Sepolia Testnet" ? (
              <p>
                Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}
              </p>
            ) : (
              <button onClick={switchNetwork} className="cta-button mint-button">
                Switch to Linea Sepolia
              </button>
            )}
          </div>
        </div>
      </header>

      <div className='flex flex-col items-center p-8'>
        <h2 className='text-3xl font-bold text-peach mb-4'>Listed Loans</h2>
        {loans.length > 0 ? (
          <ul className='w-full max-w-4xl'>
            {loans.map((loan, index) => (
              <li
                key={index}
                className='bg-lightGray p-4 my-2 rounded-lg shadow-md'
              >
                <p>Loan ID: {index}</p>
                <p>Lender: {loan.lender}</p>
                <p>Amount: {ethers.utils.formatEther(loan.amount)} ETH</p>
                <p>Interest Rate: {loan.interestRate}%</p>
                <p>Term: {loan.term} months</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No loans listed</p>
        )}
      </div>
    </div>
  );
};

export default Domain;