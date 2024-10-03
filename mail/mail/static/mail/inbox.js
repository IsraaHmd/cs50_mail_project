document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', function(event) {
    //no need but just in case
    event.preventDefault();
    try {
      send_email();
    } catch (error) {
      console.error(error);
    }
  });
  //document.querySelector('#submit').addEventListener('click', ()=> send_email())
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#EmailOpen').style.display = 'none';
  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#EmailOpen').style.display = 'none';
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  load_emails(mailbox);
}

function send_email()
{
  const sender= document.querySelector('#compose-recipients').value;
  const rec= document.querySelector('#compose-recipients').value;
  const sub= document.querySelector('#compose-subject').value;
  const bod = document.querySelector('#compose-body').value;
  console.log(`function called values: ${rec} ${sub} ${bod}`);
  let data = {
    sender: document.querySelector('#compose-recipients').value,
    recipients: document.querySelector('#compose-recipients').value,
    subject: document.querySelector('#compose-subject').value,
    body: document.querySelector('#compose-body').value,
};
JSON.stringify(data);
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject:document.querySelector('#compose-subject').value ,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    console.log(response);
    return response.json();
  })
  .then(result => {
      // Print result
      console.log(result);
      //Once the email has been sent, load the user’s sent mailbox.
      /*the response from the server aka result only includes a success message and doesnt include any details about the email that was sent that's why result.sender ... are undefined
      they are just passed above to the body in fetch.
      If you want to include the email details in the response, you could modify the JsonResponse to include them.
      However, this would mean that the same email details are sent back to all recipients,
       which might not be what you want if the email details are different for each recipient. */
       /*
       Before i wrote:
       let email = document.createElement('div');
       console.log(`${data.recipients} ${data.subject} ${data.body}`);
      email.innerHTML = `From: ${data.sender} <br> To: ${data.recipients} <br> Subject: ${data.subject} <br>`;
      //document.querySelector('#emails-view').innerHTML += email.outerHTML;
      console.log(email)
      document.querySelector('#emails-view').appendChild(email);
      which is no need and wrong, once the email is posted, just loading mailbox shows the msg*/
      load_mailbox('sent');
  })
  .catch(error => {
    console.error('Error sending email:', error);
    // Handle error, show user a message, etc.
  });
}

function load_emails(mailbox){
//fetch the emails in the mailbox
//The response.json() function parses the JSON response from the server, and if the server returns a JSON array, emails will be an array in JavaScript.
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails =>{
      emails.forEach((email) => {
      const emailElement = document.createElement('div');
      emailElement.className = 'inboxEmail';
      //who the email is from, what the subject line is, and the timestamp of the email.
      if(mailbox==='sent'){
        emailElement.innerHTML = `${email.recipients} &nbsp; ${email.subject} <span class="timeStamp">${email.timestamp}</span>`;
      }
      else{
        emailElement.innerHTML = `${email.sender} &nbsp; ${email.subject} <span class="timeStamp">${email.timestamp}</span>`;
      }
      //When the email is clicked then it is viewed and change the background to grey
      emailElement.addEventListener('click', function() {
        open_email(email, mailbox);//input should be email not emailElement, that is an html element not an email object so it will cause an error
      });
      if(email.read && mailbox =='inbox')
      {
        emailElement.style.backgroundColor = 'grey';
      }
      document.querySelector('#emails-view').append(emailElement);
    })
  });
}
function open_email(emailElement, mailbox){
  //fetch the email
  //hide compose an emails view and show email
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#EmailOpen').style.display = 'block';
/*See the hint in the Hints section about how to add an event listener to an HTML element that you’ve added to the DOM.
Once the email has been clicked on, you should mark the email as read.
Recall that you can send a PUT request to /emails/<email_id> to update whether an email is read or not.*/

  fetch(`/emails/${emailElement.id}`)
  .then(response=> response.json())
  .then(email =>
    {
      //show the email’s sender, recipients, subject, timestamp, and body.
      const element = document.createElement('div');
      element.innerHTML = `<b>From: </b>${email.sender} <br> <b>To: </b>${email.recipients}<br> <b>Subject: </b>${email.subject}<br> <b>Timestamp: </b>${email.timestamp} <hr> <div> ${email.body} </div>`;
      document.querySelector('#EmailOpen').innerHTML = '';
      document.querySelector('#EmailOpen').append(element);
      let archived = false;
      if(mailbox !='sent')
      {
          //make archiving button and reply button
          let replyButton = document.createElement('button');
          replyButton.id="replyingButton";

          let archivingButton = document.createElement('button');
          archivingButton.id = 'ArchivingButton';
          archivingButton.classList.add("aButton");

          if(mailbox ==='inbox')
          {

              archivingButton.innerHTML = "Archive";
              archived = true;
              //add the reply button:
              replyButton.classList.add("aButton");
              replyButton.innerHTML="Reply";
              replyButton.addEventListener('click',() => reply(email));
              document.querySelector('#EmailOpen').append(replyButton);
          }
          else if(mailbox ==='archive')
          {
            archivingButton.innerHTML="Unarchive";
            archived = false;
          }
          archivingButton.addEventListener('click',() => archiveOrUnarchiveEmail(email,archived));//this like must be after the one in 138 because the element button should be created first
          document.querySelector('#EmailOpen').append(archivingButton);

      }
        /*let unarchiveButton = document.createElement('button');
        unarchiveButton.id = 'UnarchiveButton';
        unarchiveButton.innerHTML="Unarchive";
        unarchiveButton.classList.add("aButton");
        archived = false;
        unarchiveButton.addEventListener('click',() => archiveOrUnarchiveEmail(email,archived));//this like must be after the one in 138 because the element button should be created first
        document.querySelector('#EmailOpen').append(unarchiveButton);*/

    });
   changeReadStatus(emailElement);
}
function changeReadStatus(EmailElement){
  fetch(`/emails/${EmailElement.id}`,
  {
    method:'PUT',
    body: JSON.stringify({
      read: true
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    else if (response.status === 204) {
        return;
    }
    else {
        return response.json();
    }
  })
  .then(response =>{console.log(response)})
  .catch(error=>{console.log(error)});
}

//function that archives/un the email
function archiveOrUnarchiveEmail(email,archivedStatus){

  fetch(`/emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: archivedStatus
    })
  })
  .then(response =>{
    if (response.status === 204) {
      console.log("reached");
      return;
  }
  else {
      return response.json();
  }
  })
  .then(response=> console.log(response))
  .catch(error => console.log(error));
  console.log("funtion reached");
  load_mailbox('inbox');
}

function reply(email){
  //take the reader to composition
  compose_email();
  //prefilled with some values
  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value = email.subject;
  document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.recipients} wrote: `;

}

/*problem: Doesn't happen all the time=> ignore
fetch in both changeReadStatus and archive func is failing but they're changing the attributes and reached is printed so put is succ but funciton reached is not printed so func load_mailbox is not called
tho no errors printed to console and in both func the response is not defined so no response returned and status is 204 and sometimes it pribnts function reached
*/
//fix css of reply and archive
//replace 168 by css
