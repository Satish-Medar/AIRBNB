(() => {
  'use strict'

  const forms = document.querySelectorAll('.needs-validation')

  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      // check all inputs inside this form
      const inputs = form.querySelectorAll('input[required], textarea[required]')
      inputs.forEach(input => {
        if (input.value.trim() === '') {
          input.setCustomValidity('Spaces are not allowed')
        } else {
          input.setCustomValidity('')
        }
      })

      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()
