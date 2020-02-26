// Contract Source
const contractSource = `
payable contract AeTwaet =

  record twaet={
    writerAddress: address,
    name: string,
    avatar: string,
    twaetBody: string,
    totalTips: int,
    tipsCount: int}

  record state = {
    twaets: map(string, twaet)}

  stateful entrypoint init(): state = {twaets={}}

  // get a twaet
  entrypoint getTwaet(id' : string) = 
    switch(Map.lookup(id', state.twaets))
      None => abort("There is no twaet with this id")
      Some(x) => x
      
  // get all twaets
  entrypoint getAllTwaets() =
    state.twaets


  // add a twaet
  stateful entrypoint addTwaet(id' :string,
   name' : string, 
   avatar' : string,
    twaet' : string) =

    let newTwaet = {
      writerAddress = Call.caller,
      name = name',
      avatar = avatar',
      twaetBody = twaet',
      totalTips = 0,
      tipsCount = 0}

    put(state{twaets[id'] = newTwaet})

  // Tip a twaet
  payable stateful entrypoint tipTwaet(id': string) =
    let twaet = getTwaet(id')
    require(twaet.writerAddress != Call.caller, "You cannot tip your own twaet")
    Chain.spend(twaet.writerAddress, Call.value)
    let newTotalTips = twaet.totalTips + Call.value
    let newTipsCount = twaet.tipsCount + 1
    let updatedTwaet ={
      writerAddress = twaet.writerAddress,
      name = twaet.name,
      avatar = twaet.avatar,
      twaetBody = twaet.twaetBody,
      totalTips = newTotalTips,
      tipsCount = newTipsCount}
    put(state{twaets[id'] = updatedTwaet})

`;

const contractAddress = 'ct_NXAxmKBnwDzCHRMw7MhQngacu4ECCvV7Ep3gFXPNg3kdNGJqy';

let client = null, contractInstance = null, twaetData = [];

let twaetsContainer = document.querySelector('.twaets__container');

// Attach event listener to the floating button
document.querySelector('.float__btn').addEventListener('click', function(){
  document.querySelector('.twaets__entry').classList.add('show-modal');
});

// Attach event listener to the close button on the form modal container
document.querySelector('#close-form').addEventListener('click', function(){
  document.querySelector('.twaets__entry').classList.remove('show-modal');
});

/* 
The function controls the state of the spinner modal by adding/removing the show-modal class from the element. */
function toggleSpinner(state){
  if(state === true){
    document.querySelector('.spinner__modal').classList.add('show-modal');
  } else {
    document.querySelector('.spinner__modal').classList.remove('show-modal');
  }
}

/* -----
The function fetches data from the blockchain on every call */
async function fetchData(){
   //Initialize the Aepp object 
   client = await Ae.Aepp();
   contractInstance = await client.getContractInstance(contractSource, {contractAddress});
   
   // Make a call to fetch all twaets available on the blockchain
   let data = (await contractInstance.methods.getAllTwaets()).decodedResult;
   return data;
}

window.addEventListener('load', async function(){
  console.log('Displaying up-to-date file -v2.4');

  // Display the spinner modal
  toggleSpinner(true);

  // fetch data from the blockchain
  twaetData = await fetchData();

  // check if data is returned
  if(twaetData){
    // display twaets
    renderTwaets();
  } else{
    twaetsContainer.textContent = 'There are no twaets available.';
  }

  toggleSpinner(false);
});

/* ------------
The function takes an object as a parameter - the parameter species the various details of the element. An HTML element is returned by the function  */
const createNewElement = params => {
	// destructure params
	const {elementType, elementId, elementClass, elementText} = params;

	let newElement;

	// create new html element
	if(elementType){
		newElement = document.createElement(elementType);
	} else {
		return false;
	}
	
	// Append ID
  if(elementId){
    newElement.id = elementId;
  }

  // append class(es)
  if(elementClass){
    newElement.classList.add(elementClass);
  }
  
  // append text content
  if(elementText){
  	newElement.textContent = elementText;
  }

  return newElement;
}

/* -----------
The function takes in a parameter and generates a twaet panel */
const createTwaetPanel = item=>{
  const twaetPanel = createNewElement({
    elementType: 'section',
    elementClass: 'twaet__panel',
    elementId: item[0]
  });

  // Twaet Header - holds the avatar and twaet's text content
  let twaetHeader = createNewElement({
    elementType: 'article',
    elementClass: 'twaet__panel__header'
  });
  twaetPanel.appendChild(twaetHeader);

  // Twaet Avatar Container
  let avatarContainer = createNewElement({
    elementType: 'article',
    elementClass: 'twaet__image__container'
  });
  twaetHeader.appendChild(avatarContainer);

  // Avatar 
  let twaetAvatar = document.createElement('img');
  twaetAvatar.src = item[1].avatar;
  twaetAvatar.setAttribute('alt', item[1].name);
  avatarContainer.appendChild(twaetAvatar);

  // Twaet Text Content Container
  let textContainer = createNewElement({
    elementType: 'p',
    elementClass: 'twaet__content',
  });
  twaetHeader.appendChild(textContainer);

  // Twaet Name
  textContainer.appendChild(createNewElement({
    elementType: 'strong',
    elementClass: 'twaet__name',
    elementText: item[1].name
  }));
 
  // Twaet Content
  textContainer.appendChild(createNewElement({
    elementType: 'span',
    elementClass: 'twaet__text',
    elementText: item[1].twaetBody
  }));

  // Twaet Info
  twaetPanel.appendChild(createNewElement({
    elementType: 'p',
    elementClass: 'twaet__info',
    elementText: `This twaet has accrued ${item[1].totalTips} ae with ${item[1].tipsCount} tips.`
  }));

  // Twaet Action
  let twaetAction = createNewElement({
    elementType: 'article',
    elementClass: 'twaet__action'
  });
  twaetPanel.appendChild(twaetAction);

  // Twaet Input
  let twaetInput = document.createElement('input');
  twaetInput.setAttribute('type', 'number');
  twaetInput.setAttribute('required', '');
  twaetInput.id = 'tip-entry';
  twaetInput.setAttribute('placeholder', 'Enter tip');
  twaetAction.appendChild(twaetInput);

  // Submit Button
  let submitBtn = createNewElement({
    elementType: 'button',
    elementText: 'Tip Twaet',
    elementClass: 'btn-primary'
  });
  submitBtn.setAttribute('type', 'button');
  twaetAction.appendChild(submitBtn);

  /* --------
Attach a click event listener to all tip button in a twaet panel. This triggers a tipTwaet on the contract */
submitBtn.addEventListener('click', async function(e){
  // check for an empty submission
  if(twaetInput.value === ''){
    twaetInput.setAttribute('placeholder', 'Your cannot submit an empty value');
    return false;
  }	
  // check if entry is a number
  else if(isNaN(twaetInput.value)){
    twaetInput.setAttribute('placeholder', 'Your entry is not a number');
    return false;
  }
  // check if entry is zero or less than zero
  else if(twaetInput.value <= 0 ){
    twaetInput.setAttribute('placeholder', 'You cannot tip with 0 or a value less than 0');
    return false;
  } else{
    // show spinner
    toggleSpinner(true);
  
    // twaet info
    let twaetId = twaetPanel.id;
    let tipAmount = parseInt(twaetInput.value.trim());
   
    // update data on the blockchain
    await contractInstance.methods.tipTwaet(twaetId, {amount: tipAmount})
      .then(()=>{
        // refetch data from the 
        twaetData = fetchData();
        // display the new data
        renderTwaets();
        // hide spinner
        toggleSpinner(false);
      })
      .catch(e => {
        console.log(e);
        return false;
      });  
  }
});

  return twaetPanel;
}

/* --------
The function renders the twaets panel */
async function renderTwaets(){
   // map the content of twaetData to create twaet panels
   const docFrag = document.createDocumentFragment();
   (await twaetData).sort((a, b)=> parseInt(b[1].totalTips) - parseInt(a[1].totalTips)).map(item =>{
     docFrag.appendChild(createTwaetPanel(item))
   });

  //  remove exisiting children for twaets container
  while(twaetsContainer.firstElementChild){
    twaetsContainer.removeChild(twaetsContainer.firstElementChild);
  }

  // append panels to the twaets container
  twaetsContainer.appendChild(docFrag);
}

/* ---------
Attach a submit listener to the form element. Create and submit a new twaet when the form is submitted. This triggers the addTwaet on the contract */
document.querySelector('#twaet-form').addEventListener('submit', async function(e){
  e.preventDefault();

  // show spinner
  toggleSpinner(true);

  // grab form inputs
  let nameEntry = document.querySelector('#name');
  let avatarEntry = document.querySelector('#avatar');
  let twaetEntry = document.querySelector('#twaet');
	
  await contractInstance.methods.addTwaet(Date.now().toString(), nameEntry.value.trim(), avatarEntry.value.trim(), twaetEntry.value.trim())
    .then(()=>{
      // refetch data from the blockchain
      twaetData = fetchData();
      
      // clear form entries
      nameEntry.value =''; avatarEntry.value = ''; twaetEntry.value = '';

      // close form modal
      document.querySelector('#close-form').click();

      // render Twaets
      renderTwaets();

      // hide spinner
      toggleSpinner(false);
    })
    .catch(e => {
      console.log(e);
      return false;
    });
});
