$(document).ready(function() {
  $('.buttons .button').on('click', function() {
    const newStyle = $(this).data('style');
    $('.buttons .button').removeClass('selected');
    $(this).addClass('selected');
    $('.description').removeClass('standard techy journo').addClass(newStyle);
  });
});
