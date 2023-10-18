const attendanceForm = document.getElementById('attendance-form');
const attendanceYearInput = document.getElementById('attendance-year-input');
const attendanceWeekInput = document.getElementById('attendance-week-input');
const attendanceEventInput = document.getElementById('attendance-event-input');


const getProcedures = async () => {
  const procedureData = await MinistryPlatformAPI.request('get', '/tables/procedures', {"$select":"Procedure_Title, Procedure_ID, Purpose, Ministry_ID_Table.[Ministry_Name]","$filter":"Active = 1", "$orderby":"Procedure_Title ASC"}, {})
  return procedureData
}
const getMinistries = async () => {
  const ministries = await MinistryPlatformAPI.request('get', '/tables/procedures', {"$select":"Ministry_ID_Table.[Ministry_Name]", "$filter":"Active = 1", "$distinct":"True"}, {})
  return ministries
}

function decodeJWT() {
  try {
      const jwt = Cookie.getCookie("access_token"); 
      if (jwt) {
        const base64Url = jwt.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
      }
      else {
        return 401
      }
  } catch (error) {
      console.error("Error decoding JWT", error);
      return null;
  }
}
// const username = decodeJWT().name;
// console.log(username)
function getUserGUID() {

  const decodedJWT = decodeJWT();

  if (decodedJWT) {

    console.log(decodedJWT.sub);

    return decodedJWT.sub;
  } else {
    console.error('Could not get UserGUID');
    return null;
  }
}

const nonAuthenticatedWebpage = document.getElementsByClassName('non-authenticated-webpage');
const logoutButton = document.getElementById('logout-button'); 

async function authenticateWebpage() {
  try {
    const decodedJWT = decodeJWT();
    if (decodedJWT) {
      const JWTexp = decodedJWT.exp;
      const currentTimestamp = Math.floor(Date.now() / 1000); // Convert current time to seconds

      if (JWTexp > currentTimestamp) {
        // JWT is not expired
        for (let i = 0; i < nonAuthenticatedWebpage.length; i++) {
          nonAuthenticatedWebpage[i].style.display = 'none'; // Hide the element
        }

        // Populate the username
        populateList(); // Assuming this function populates some list as its name suggests
      }else {
        // Hide the logout button
        logoutButton.style.display = 'none';
        return;
      }
    } else {
      // Hide the logout button
      logoutButton.style.display = 'none';
      return;
    }
  } catch (error) {
    console.error("Error authenticating webpage", error);
    return null;
  }
}
authenticateWebpage();

// Reference to the unordered list in your HTML
async function populateList() {
  const ulElement = document.getElementById("nameList");
  const searchInput = document.getElementById("searchInput");
  const ministryDropdown = document.getElementById("ministryDropdown");
  // Populate dropdown with ministries
  const ministries = await getMinistries();
  console.log(ministries)
  ministries.forEach(ministry => {
    const optionElement = document.createElement("option");
    const ministryName = ministry.Ministry_Name || "null";
    optionElement.value = ministryName;
    optionElement.textContent = ministryName;
    ministryDropdown.appendChild(optionElement);
  });


  const objectsArray = await getProcedures();

  // Initial rendering of the list
  renderList(objectsArray);

  // Event listeners for the search input and the ministry dropdown
  searchInput.addEventListener('input', filterList);
  ministryDropdown.addEventListener('change', filterList);

  function filterList() {
      const filteredArray = objectsArray.filter(obj => {
          const title = obj.Procedure_Title || '';
          const purpose = obj.Purpose || '';
          const ministry = obj.Ministry_Name || '';

          const searchCriteria = searchInput.value.toLowerCase();
          const ministryCriteria = ministryDropdown.value;

          return (
              (title.toLowerCase().includes(searchCriteria) || purpose.toLowerCase().includes(searchCriteria)) &&
              (ministryCriteria === '' || ministry === ministryCriteria)
          );
      });

      renderList(filteredArray);
  }
}



function renderList(array) {
    const ulElement = document.getElementById("nameList");
    ulElement.innerHTML = ''; // Clear the current list

    array.forEach(obj => {
        // Create a new list item
        const liElement = document.createElement("li");

        // Create an anchor element for redirection
        const anchorElement = document.createElement("a");
        anchorElement.href = `${window.location.origin}/index.html?id=${obj.Procedure_ID}`;

        const titleElement = document.createElement("h2");
        const descriptionElement = document.createElement("h4");

        titleElement.textContent = obj.Procedure_Title + ' | ' + obj.Ministry_Name;
        descriptionElement.textContent = obj.Purpose;
        // Append the title and description to the anchor
        anchorElement.appendChild(titleElement);
        anchorElement.appendChild(descriptionElement);

        // Append the anchor to the list item
        liElement.appendChild(anchorElement);

        // Append the list item to the unordered list
        ulElement.appendChild(liElement);
    });
}

// Call the populateList function to start the process


const getSingleProcedureData = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const procedureData = await MinistryPlatformAPI.request('get', '/tables/procedures', {"$select":"Procedure_Title, Purpose, Step_by_Step","$filter":"Procedure_ID="+id}, {})

  return procedureData

}

async function displayProcedure() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

  if (!id) return;  // Exit if no ID in URL

  const procedureData = await getSingleProcedureData();
  if (!procedureData) return;  // Exit if no procedure data found
  // Hide home page div
  document.getElementById("home-page").style.display = "none";

  // Populate document page div
  const documentPageDiv = document.getElementById("document-page");

  // Create and append title
  const h1Element = document.createElement('h1');
  h1Element.textContent = procedureData[0].Procedure_Title;
  documentPageDiv.appendChild(h1Element);

  // Create and append purpose
  const h3Element = document.createElement('h3');
  h3Element.textContent = procedureData[0].Purpose;
  documentPageDiv.appendChild(h3Element);

  // You can continue this pattern to display the Step_by_Step and other elements

  // For example, to display the Step_by_Step, 
  // since it contains HTML, you can set the innerHTML of a div
  const stepDiv = document.createElement('div');
  stepDiv.innerHTML = procedureData[0].Step_by_Step;
  documentPageDiv.appendChild(stepDiv);
}
displayProcedure()
