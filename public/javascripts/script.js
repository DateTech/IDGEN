$(window).on('scroll',function(){
  var wscroll = $(this).scrollTop();
  
  if(wscroll > 10){
    $(".navbar").addClass("shrink-nav");
  }
  else{
    $(".navbar").removeClass("shrink-nav");
  }
});

$(document).ready(function(){
  //img update form
  $("#profileImage").click(function(e) {
    $("#imageUpload").click();
  });

  function fasterPreview(uploader) {
    if ( uploader.files && uploader.files[0] ){
      $('#profileImage').attr('src', window.URL.createObjectURL(uploader.files[0]) );
    }
  }
  
  $("#imageUpload").change(function(){
      fasterPreview(this);
  });

  console.log("Ready");

  
  let dropdown = $('#selState');

  dropdown.empty();

  dropdown.append('<option selected="true" disabled>Choose State</option>');
  dropdown.prop('selectedIndex', 0);

  const url = '/javascripts/state-lg.json';

  // Populate dropdown with list of provinces
  $.getJSON(url, function (data) {
    $.each(data, function (key, entry) {
      dropdown.append($('<option></option>').attr('value', entry.state.id).text(entry.state.name));
    });
  });

  $('#selState').on('change', function(){

    var state_id = $('#selState').val();
    
    let dropdown2 = $('#selLocal');

    dropdown2.empty();

    dropdown2.append('<option selected="true" disabled>Choose Local Government</option>');
    dropdown2.prop('selectedIndex', 0);

    $.getJSON(url, function (data) {
      $.each(data, function (key, entry) {
        if(entry.state.id == state_id){
          $.each(entry.state.locals, function(key, loc){
            dropdown2.append($('<option></option>').attr('value', loc.id).text(loc.name));
          });
        }
      });
    });  
  });

  function printData()
  {
    var divToPrint=document.getElementById("idcard");
    newWin= window.open("");
    newWin.document.write(divToPrint.outerHTML);
    newWin.print();
    newWin.close();
  }

  $('#btnPrint').on('click',function(){
    printData();
  })
});