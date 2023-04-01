document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Send Mail
  document.querySelector('#compose-form').onsubmit = send_mail;
  //document.querySelector('#compose-form').addEventListener('submit', send_mail);
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-content').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-content').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get the list of email
  get_emails(mailbox);
}

function send_mail(event){
  event.preventDefault();
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // POST Emails
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  });
}

function get_emails(mailbox){
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      // For every email create a div
      emails.forEach(email => {
        // Create div container
        const containerEmail = document.createElement('div');
        containerEmail.className = "container-email border d-flex bd-highlight";

        // Create div email
        const element = document.createElement('div');
        element.className = "email d-flex p-2 flex-fill bd-highlight";
        if (mailbox === 'inbox'){
          element.innerHTML = `
          <h5>From: ${email.sender}</h5>
          <p class="flex-grow-1"> ${email.subject}</p>
          <p>${email.timestamp}</p>`;
        } else if (mailbox ==='archive'){
          element.innerHTML = `
          <h5>From: ${email.sender}</h5>
          <p class="flex-grow-1"> ${email.subject}</p>
          <p>${email.timestamp}</p>`;
        }else if (mailbox === 'sent'){
          element.innerHTML = `
          <h5>To: ${email.recipients}</h5>
          <p class="flex-grow-1"> ${email.subject}</p>
          <p>${email.timestamp}</p>`;
        }

        // Append the email element to the div content
        containerEmail.appendChild(element);
        
        // Change background when email read
        if (email.read === false){
          element.className = "email d-flex p-2 flex-fill bd-highlight bg-white";
        } else {
          element.className = "email d-flex p-2 flex-fill bd-highlight bg-secondary";
        }

        // Open the email when click
        element.addEventListener('click', () => open_email(email.id));

        // Add archive and unarchive button
        if (mailbox === 'inbox'){
          // Create Archive button
          const archive = document.createElement('button');
          archive.className = "btn btn-danger p-2 bd-highlight";
          archive.innerHTML = "Archive";

          // Append the button to the div container
          containerEmail.appendChild(archive);

          // Add the event to the button
          archive.addEventListener('click', function(){
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: true
              })
            })
            load_mailbox('inbox');
            location.reload();
          });
        } else if (mailbox ==='archive'){
          // Create Unarchive button
          const unarchive = document.createElement('button');
          unarchive.className = "btn btn-success p-2  bd-highlight";
          unarchive.innerHTML = "Unarchive";

          // Append the button to the div container
          containerEmail.appendChild(unarchive);

          // Add the event to the button
          unarchive.addEventListener('click', function(){
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: false
              })
            })
            load_mailbox('inbox');
            location.reload();
          });
        }

        // Append the div container (email and button) to the emails view
        document.querySelector('#emails-view').append(containerEmail);
      });
  });
}


function open_email(id){
  // Show the email content and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-content').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';


  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);
  
      // Show the email content
      const element = document.querySelector('#email-content');
      element.innerHTML = `
      <p><b>From:</b> ${email.sender} </p>
      <p><b>To:</b> ${email.recipients}</p>
      <p><b>Subject:</b> ${email.subject}</p>
      <p><b>Timestamp:</b> ${email.timestamp}</p>
      <button class="btn btn-sm btn-outline-primary" id="reply"> Reply </button>
      <button id="archiveUnarchive"></button>
      <hr>
      <p>${email.body}</p>`;

      // Change the staus of the email to read
      if (email.read === false){
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })
      }

      // Add function to Reply button
      const replyButton = document.querySelector('#reply');
      replyButton.addEventListener('click', () => reply(email));

      // Archive/unarchive button
      const archiveUnarchive = document.querySelector('#archiveUnarchive');
      if(email.archived === false){
        archiveUnarchive.className = "btn btn-outline-danger";
        archiveUnarchive.innerHTML = "Archive";

        // Add the event to the button
        archiveUnarchive.addEventListener('click', function(){
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: true
            })
          })
          load_mailbox('inbox');
          location.reload();
        });
      } else {
        archiveUnarchive.className = "btn btn-outline-success";
        archiveUnarchive.innerHTML = "Unarchive";

        // Add the event to the button
        archiveUnarchive.addEventListener('click', function(){
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: false
            })
          })
          load_mailbox('inbox');
          location.reload();
        });
      }
  });
}

function reply(email){
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-content').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Pre-fill the composition fields
  document.querySelector('#compose-recipients').value = email.sender;
  // Split the entire subject by letter and take the firs 3 letter 
  let beginningSubject = email.subject.split('')[0] + email.subject.split('')[1] + email.subject.split('')[2];
  if (beginningSubject !== "Re:"){
    email.subject = "Re: " + email.subject;
  }
  document.querySelector('#compose-subject').value = email.subject;
  document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
}