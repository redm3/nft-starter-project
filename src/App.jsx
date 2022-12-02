import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import myEpicNft from './Utils/MyEpicNFT.json';

// Constants
const TWITTER_HANDLE = 'Redm3Eth';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/collection/marconft-vynuxw4rbr';
const TOTAL_MINT_COUNT = 99;

const CONTRACT_ADDRESS = "0x72F2d4f1cD3E3D18820a04cffCfEda0E3F8bB92e"
const RINKEBY_CHAIN_ID = "0x4"; 

const App = () => {

  const [currentAccount, setCurrentAccount] = useState("");
  const [totalMintedNft, setTotalMintedNft] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account: ", account);
      setCurrentAccount(account)
      setupEventListener()
    } else {
      console.log("No authorized account found!")
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      console.log('Connected: ', accounts[0]);
      setCurrentAccount(accounts[0]);

      setupEventListener() 
    } catch(error) {
      console.log(error)
    }
  }

  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          alert(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
        });

        console.log("Setup event listener!")

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const askContractToMintNFT = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);
        console.log(connectedContract)
        console.log('Going to pop wallet now to pay gas...')
        let nftTxn = await connectedContract.makeAnEpicNFT();

        setIsLoading(true)
        console.log('Mining...please wait.')
        await nftTxn.wait();
        setIsLoading(false)

        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);

        let mintedSoFar = await connectedContract.getTotalNFTsMintedSoFar();
        const alreadyMintedCount = parseInt(mintedSoFar._hex, 16)
        setTotalMintedNft(alreadyMintedCount)
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch(error) {
      console.log(error)
    }
  }

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  useEffect( async () => {
    checkIfWalletIsConnected();
    let chainId = await ethereum.request({ method: 'eth_chainId' });

    if (chainId !== RINKEBY_CHAIN_ID) {
      if (confirm("❗You are not connected to the Rinkeby Test Network! \n\nIf you want, we will change to the correct network: \n✅Rinkeby Test Network. \n\n Click on the 'OK' button below! 👇")) {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x4' }],
        });
      }
    } else {
      await fetchMintedNftCounter();
    }
  }, [])

  const fetchMintedNftCounter = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        let mintedSoFar = await connectedContract.getTotalNFTsMintedSoFar();
        setTotalMintedNft(parseInt(mintedSoFar._hex, 16))
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch(error) {
      console.log(error)
    }
  }

  ethereum.on('chainChanged', async (chainId) => {
    if (chainId === RINKEBY_CHAIN_ID) {
      await fetchMintedNftCounter();
    }
  });

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="header-mint_counter sub-text">
            {`${totalMintedNft}/${TOTAL_MINT_COUNT} NFTs minted so far`}
          </p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {
            currentAccount === "" ? (
              renderNotConnectedContainer()
            ) : [ !isLoading ? (
              <button onClick={askContractToMintNFT} className="cta-button connect-wallet-button" key="mint">
               Mint NFT
              </button>
            ) : (<div className="lds-roller" key="loading"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
          </div>)
            ]
          }
          
        </div>
        <div className="footer-container">
          <div className="footer-block">
            <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
            <a
              className="footer-text"
              href={TWITTER_LINK}
              target="_blank"
              rel="noreferrer"
            >{`${TWITTER_HANDLE}`}</a>
          </div>

          <div className="footer-block">
            <span 
              style={{marginRight: 0.2 + 'em', fontSize: 1.5 + 'em'}}
            > 🌊 </span>
            <a 
              className="footer-text"
              href={OPENSEA_LINK}
              target="_blank"
              rel="noreferrer"
            >Collection on OpenSea</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;