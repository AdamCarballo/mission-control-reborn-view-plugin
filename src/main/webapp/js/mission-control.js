function format_date(dt) {
  return dt.getFullYear()
    + '-' + (dt.getMonth()<9?'0':'') + (dt.getMonth() + 1)
    + '-' + (dt.getDate()<10?'0':'') + dt.getDate()
    + ' ' + (dt.getHours()<10?'0':'') + dt.getHours()
    + ':' + (dt.getMinutes()<10?'0':'') + dt.getMinutes()
    + ':' + (dt.getSeconds()<10?'0':'') + dt.getSeconds();
}

function format_interval(iv) {
  if (iv < 1000) { return iv + 'ms'; }

  ivStr = '';
  // Days
  if (iv > 86400000) {
    ivStr = Math.floor(iv/86400000) + 'd';
    iv = iv - Math.floor(iv/86400000)*86400000;
  }
  // Hours
  if (iv > 3600000) {
    ivStr += ' ' + Math.floor(iv/3600000) + 'h';
    iv = iv - Math.floor(iv/3600000)*3600000;
  }
  // Minutes
  if (iv > 60000) {
    ivStr += ' ' + Math.floor(iv/60000) + 'm';
    iv = iv - Math.floor(iv/60000)*60000;
  }
  // Seconds
  if (iv > 1000)
    ivStr += ' ' + Math.floor(iv/1000) + 's';
  return ivStr;
}

/**
 * Sanitize and encode all HTML in a user-submitted string
 * https://portswigger.net/web-security/cross-site-scripting/preventing
 * @param  {String} str  The user-submitted string
 * @return {String} str  The sanitized string
 */
var sanitizeHTML = function (str) {
	return str.replace(/[^\w.\p{Emoji} ]/giu, function (c) {
		return '&#' + c.charCodeAt(0) + ';';
	});
};

function reload_jenkins_build_queue(tableSelector, jenkinsUrl, buildQueueSize) {
  $.getJSON( jenkinsUrl + '/queue/api/json', function( data ) {
    // Remove all existing rows
    $(tableSelector + ' tbody').find('tr').remove();
    i = 0;
    $.each( data.items, function( key, val ) {
      i++;
      if (i > buildQueueSize) {
        return;
      }
      startDate = new Date(val.inQueueSince);
      now = new Date();
      waitingFor = now.getTime() - val.inQueueSince;
      taskName = val.task.name.replace(/(,?)\w*=/g, "$1");
      newRow = '<tr><td class="text-left"><a href="' + val.task.url + '">'+ sanitizeHTML(taskName) + '</a></td><td>' + format_date(startDate) + '</td><td>' + format_interval(waitingFor) + '</td></tr>';
      $(tableSelector + ' tbody').append(newRow);
    });
  });
}

function reload_jenkins_node_statuses(id, jenkinsUrl, nodeStatuses, buttonClass) {
  $.getJSON( jenkinsUrl + '/computer/api/json', function( data ) {
		let parent = document.getElementById(id);
		// Clear all entries
		parent.replaceChildren();

    $.each( data.computer, function( key, val ) {
      classes = !val.offline ? 'btn-success' : 'btn-danger';
      if (val.displayName == "Built-In Node")
        nodeLinkName = '(built-in)';
      else
        nodeLinkName = val.displayName;
      newDiv = '<a href="' + jenkinsUrl + '/computer/' + encodeURIComponent(nodeLinkName) + '/"><button class="btn ' + buttonClass + ' ' + classes + ' col-lg-6">' + sanitizeHTML(val.displayName) + ' &#47; ' + val.numExecutors + '</button></a>';
      $(`#${id}`).append(newDiv);
    });
  });
}

function reload_jenkins_build_history(tableSelector, viewUrl, buildHistorySize) {
  $.getJSON( viewUrl + '/api/json', function( data ) {
    // Remove all existing rows
    $(tableSelector + ' tbody').find('tr').remove();
    i = 0;
    $.each( data.builds, function( key, val ) {
      i++;
      if (i > buildHistorySize) {
        return;
      }
      dt = new Date(val.startTime + val.duration);
      jobName = val.buildName.replace(/(.*) #.*/, '$1');
      switch (val.result) {
        case 'SUCCESS':
          classes = '';
          break;
        case 'FAILURE':
          classes = 'danger';
          break;
        case 'ABORTED':
					classes = 'aborted invert-text-color';
					break;
        case 'UNSTABLE':
          classes = 'warning';
          break;
        case 'BUILDING':
          classes = 'info invert-text-color';
          break;
        default:
          console.log('Job: ' + val.jobName + ' Result: ' + val.result);
          classes = '';
      }
        newRow = '<tr class="' + classes + '"><td class="text-left">' + sanitizeHTML(jobName) + '</td><td><a href="' + val.buildUrl + '">' + val.number + '</a></td><td>' + format_date(dt) + '</td><td>' + format_interval(val.duration) + '</td></tr>';
      $(tableSelector + ' tbody').append(newRow);
    });
  });
}

function reload_jenkins_job_statuses(id, viewUrl, buttonClass) {
  $.getJSON( viewUrl + '/api/json', function( data ) {
		let parent = document.getElementById(id);
		// Clear all entries
		parent.replaceChildren();

    $.each( data.allJobsStatuses, function( key, val ) {
			let classes = [];
      switch (val.status) {
        case 'SUCCESS':
          classes.push('btn-success');
          break;
        case 'FAILURE':
          classes.push('btn-danger');
          break;
        case 'ABORTED':
					classes.push('btn-aborted');
					classes.push('invert-text-color');
					break;
        case 'UNSTABLE':
          classes.push('btn-warning');
          break;
        case 'DISABLED':
        case 'NOT_BUILT':
          classes.push('invert-text-color');
          break;
        case 'BUILDING':
          classes.push('btn-info');
					classes.push('invert-text-color');
          break;
        default:
					console.warn(`Unknown job status | Job: ${val.jobName} Status: ${val.status}`);
          classes.push('btn-primary');
      }

			let btn = document.createElement("button");
			btn.classList.add('btn');
			if (buttonClass) {
				btn.classList.add(buttonClass);
			}
			btn.classList.add(...classes);
			btn.classList.add('col-lg-6');
			btn.onclick = function(){ location.href = val.jobUrl; };
			btn.innerHTML = sanitizeHTML(val.jobName);

      document.getElementById(id).appendChild(btn);
    });
  });
}
