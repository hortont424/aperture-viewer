google.load("jquery", "1");
google.load("jqueryui", "1");
google.setOnLoadCallback(main);

toplevelTags = [];
intersectingTags = null;
choosers = [];

function getSelectedTags()
{
    selectedTags = [];
    
    for(i in choosers)
        selectedTags.push(choosers[i].val());
    
    return selectedTags;
}

function selectInChooser(num)
{
    // Delay until intersecting tags have been loaded
    if(intersectingTags == null)
        window.setTimeout("selectInChooser("+num+")", 100);
    
    // Hide currently-shown images
    $("#images").empty();
    
    // Remove choosers that are invalidated by the change
    badChoosers = choosers.slice(num + 1, choosers.length + 1);
    choosers = choosers.slice(0, num + 1);
    
    for(var i in badChoosers)
        badChoosers[i].remove();
    
    // Get the list of selected tags; we only want to display
    // tags in the next chooser which intersect with all of these
    tagList = getSelectedTags();
    
    var otherTags = {};

    var i, j, ct, total = 0;

    // Calculate the intersecting tags
    $.each(intersectingTags, 
        function(inkey,invalue)
        {
            var pictureNames = (invalue + "").split(",");
            ct = 0;
            
            for(var i = 0; i < pictureNames.length; i++)
                if($.inArray(pictureNames[i], tagList) >= 0)
                    if(++ct == tagList.length)
                        break;

            if(ct == tagList.length)
            {
                for(i = pictureNames.length - 1; i >= 0; --i)
                if(!otherTags[pictureNames[i]])
                    otherTags[pictureNames[i]] = 1;
                else
                    otherTags[pictureNames[i]] += 1;
                ++total;
            }
        }
    );
    
    // Update the count
    var pluralizedPix = " pictures"
    if(total == 1)
        pluralizedPix = " picture"
    $("#pictureCount").html(total + pluralizedPix);
    
    // Pull out the names and create the new chooser!
    names = {};
    hadNames = false;
    
    $.each(otherTags, function(key, value)
    {
        if($.inArray(key, tagList) < 0)
        {
            names[key] = value;
            hadNames = true;
        }
    });
    
    if(hadNames)
        loadTags(num + 1, names)
}

function createChooser(num, tags)
{
    choosers[num] = $("<select id='chooser' size='15'></select>");
    
    for(var i in tags)
        choosers[num].append("<option>" + tags[i] + "</option>");
    
    choosers[num].change(function(){selectInChooser(num)});
    
    updateChoosers();
    
    $("#choosers").append(choosers[num]);
}

function updateChoosers()
{
    // Calculate and update the width of the choosers
    percentWidth = Math.floor(100 / choosers.length);
    
    for(var i in choosers)
        choosers[i].width(percentWidth + "%")
}

function loadInitialTags(data)
{
    toplevelTags = loadTags(0, data);
}

function loadTags(chooser, data)
{
    tagCounts = [];
    tags = [];
    
    // Create a *sortable* array of name/count objects
    $.each(data, function(key, value)
    {
        tagCounts.push({"tag": key, "count": value});
    });
    
    // Sort the names, ascending, by number of tagged images
    tagCounts.sort(function(a,b)
    {
        return b.count - a.count;
    });
    
    // Pull the sorted list of names into a simple array
    for(var i in tagCounts)
        tags[i] = tagCounts[i].tag;
    
    // Create the chooser
    createChooser(chooser, tags);
    
    return tags;
}

function loadIntersections(data)
{
    intersectingTags = data;
}

function resetSelection()
{
    $("#choosers").empty();
    $("#images").empty();
    $("#pictureCount").empty();
    choosers = [];
    createChooser(0, toplevelTags);
}

function loadSelection()
{
    var tags = getSelectedTags().join(",");
    $("#images").load("ap-tags.cgi?pictureTags=" + tags, 0, loadedSelection);
    $("#spin").show()
}

function loadedSelection()
{
    $("#spin").hide()
    $("a.zoom").fancybox();
}

function main()
{
    $(function()
    {
        installFancybox();
        $("*").ajaxStart(function() { $("#spin").show() });
        $("*").ajaxStop(function() { $("#spin").hide() });
        $.getJSON("ap-tags.cgi?pictures=1", loadIntersections);
        $.getJSON("ap-tags.cgi?tags=1", loadInitialTags);
        $("#slider").slider();
    });
}