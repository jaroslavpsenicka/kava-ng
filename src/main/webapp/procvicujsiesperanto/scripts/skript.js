/*

    Testilo
    Copyright (C) 2015  Katarína Nosková & Peter Novotníček

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

 */

(function($) {
  $(document).ready(function(){
	// vymaže všetky inputy
	$('input:text').each(function(i) {
		$(this).val('');
		});
	// všetky selectboxy nastaví ako prázdne
	$('select').each(function(i) {
		$(this).val('');
	});
	// ak boli nejaké option zaškrtnuté, nastavia sa ako nezaškrtnuté
	$("input[type='radio']:checked").each(function(i) {
		$(this).prop('checked', false);
	});
	// ak bol pomocný text k audio cvičeniam zobrazený, pri opätovnom načítaní stránky sa skryje
	$('#napoveda:visible').toggleClass("skryty");

	function invisible() {
	// skryje tlačidlo pre nasledujúci test a hodnotenia
		$('#nasledujuci').hide();
		$('#do70').hide();
		$('#nad70').hide();
	}

	function skry() {
	// skryje pomocný text k audio cvičeniam, ak je zobrazený
		$('#napoveda:visible').toggleClass("skryty");
	}

	// skontroluje správnosť odpovedí
	$('#submit').click(function(){
		var spravnych = 0;
		var celkom = 0;
		// typ doplň
    	$('input:text').each(function(i) {
			celkom++;
			var orezane = $.trim($(this).val()).replace("sx","ŝ").replace("gx","ĝ").replace("cx","ĉ").replace("ux","ŭ").replace("jx","ĵ").replace("hx","ĥ").replace("Sx","Ŝ").replace("Gx","Ĝ").replace("Cx","Ĉ").replace("Ux","Ŭ").replace("Jx","Ĵ").replace("Hx","Ĥ");
            $(this).val(orezane);

			if ($.isArray(odpovedeDopln[i])) {	// možnosť viacero správnych odpovedí
				$(this).parent().parent().css("background-color", "#F1A37C");	// najskôr odpovede označí červeným
				for (var j=0; j < odpovedeDopln[i].length; j++) {
					if ($(this).val() == odpovedeDopln[i][j]) {
						$(this).parent().parent().css("background-color", "#CBFACB");	// správne odpovede preznačí zeleným
						spravnych++;
					}
				}
			} else {
				if ($(this).val() == odpovedeDopln[i]) {
					$(this).parent().parent().css("background-color", "#CBFACB");	// správne odpovede označí zeleným
					spravnych++;
				} else {
					$(this).parent().parent().css("background-color", "#F1A37C");	// nesprávne odpovede označí červeným
				}
			}

		});
		// typ vyber
    	$('option:selected').each(function(i) {
			celkom++;
			if ($.isArray(odpovedeVyber[i])) {	// možnosť viacero správnych odpovedí
				$(this).parent().parent().css("background-color", "#F1A37C");	// najskôr odpovede označí červeným
				for (var j=0; j < odpovedeVyber[i].length; j++) {
					if ($(this).val() == odpovedeVyber[i][j]) {
						$(this).parent().parent().css("background-color", "#CBFACB");	// správne odpovede preznačí zeleným
						spravnych++;
					}
				}
			} else {
				if ($(this).val() == odpovedeVyber[i]) {
					$(this).parent().parent().css("background-color", "#CBFACB");	// správne označí zeleným
					spravnych++;
				} else {
					$(this).parent().parent().css("background-color", "#F1A37C");	// nesprávne odpovede označí červeným
				}
			}
		});
		// typ option
    	$('form').each(function(i) {
			celkom++;
			$(this).parent().css("background-color", "#F1A37C");	// najskôr všetky označí červeným
			$("input[type='radio']:checked", this).each(function() {
				if ($(this).val() == odpovedeOption[i]) {
					$(this).parent().parent().css("background-color", "#CBFACB");	// správne odpovede preznačí zeleným
					spravnych++;
				}
			});
		});

		var nespravnych = celkom - spravnych;
		var percenta = Math.round(spravnych / celkom * 100);
		$('#spravneVysledky').text(spravnych);
		$('#nespravneVysledky').text(nespravnych);
		$('#kolkoPercent').text(percenta);

		// ak je výsledok viac ako 70 %, zobraz tlačidlo pre nasledujúci test
		if (percenta > 70) {
			$('#nasledujuci').show();
			$('#nad70').show();
		} else {
			$('#do70').show();
		 }
	});

	// zobrazí správne odpovede
	$('#show').click(function(){
		// typ doplň
		$('input:text').each(function(i) {
			if ($.isArray(odpovedeDopln[i])) {
				$(this).val(odpovedeDopln[i][0]).parent().parent().css("background-color", "#FAFAA4");
				$(this).parent().parent().prop('title', 'možné odpovědi: ' + odpovedeDopln[i]);
			} else {
				$(this).val(odpovedeDopln[i]);
			}
		});
		// typ vyber
		$('select').each(function(i) {
			if ($.isArray(odpovedeVyber[i])) {
				$(this).val(odpovedeVyber[i][0]).parent().css("background-color", "#FAFAA4");
				$(this).parent().prop('title', 'možné odpovědi: ' + odpovedeVyber[i]);
			} else {
				$(this).val(odpovedeVyber[i]);
			}
		});
		// typ option
		$("input[type='radio'].spravne").each(function(i) {
				$(this).prop("checked", true);
		});
		invisible()
	});

	// vymaže všetky odpovede
	$('#clear').click(function(){
		// typ doplň
		$('input:text').each(function(i) {
			$(this).val('');
			$(this).parent().parent().css("background-color", "transparent");
		});
		// typ vyber
		$('select').each(function(i) {
			$(this).val('');
			$(this).parent().css("background-color", "transparent");
		});
		// typ option
		$("input[type='radio']").each(function(i) {
			$(this).prop('checked', false);
			$(this).parent().parent().css("background-color", "transparent");
		});
		// vynuluje počítanie
		var spravnych = 0;
		var nespravnych = 0;
		var percenta = 0;
		$('#spravneVysledky').text(spravnych);
		$('#nespravneVysledky').text(nespravnych);
		$('#kolkoPercent').text(percenta);
		invisible();
		skry();
	});

	// zobrazí/skryje pomocný text k audio cvičeniam
	$('#prehodviditelnost').click(function() {
		$('#napoveda').toggleClass("skryty");
	});

  });
})( jQuery );
