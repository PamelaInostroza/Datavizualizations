library(dplyr)
library(stringr)
library(jsonlite)

Govern <- read.csv("Governance indicators2018-2020.csv")
str(Govern)
GovernData <- Govern %>% filter(!is.na(Time)) %>% mutate(Series.Name = str_remove(Series.Name, ": Estimate")) %>% 
  reshape2::dcast(Country.Name + Country.Code + Series.Name + Series.Code ~ Time, value.var = "Value") %>% 
  mutate(`2020` = `2019`, `2021` = `2019`) %>% 
  reshape2::melt(variable.name = "Time") %>% 
  reshape2::dcast(Country.Name + Country.Code + Time ~ Series.Name, value.var = "value") 
GovernData
WDIndicat <- read.csv("World development indicators 2018-2020.csv")
str(WDIndicat)
WDIndicData <- WDIndicat %>% filter(!is.na(Time)) %>%  mutate(Series.Name = str_remove(Series.Name, ": Estimate")) %>% 
  reshape2::dcast(Country.Name + Country.Code + Series.Name + Series.Code ~ Time, value.var = "Value") %>% 
  mutate(`2020` = `2019`, `2021` = `2019`) %>% 
  reshape2::melt(variable.name = "Time") %>% 
  reshape2::dcast(Country.Name + Country.Code + Time ~ Series.Name, value.var = "value")
WDIndicData
Indicators <- full_join(GovernData, WDIndicData, by = c("Country.Name", "Country.Code", "Time")) %>% 
  mutate(Time = as.numeric(as.character(Time)))
str(Indicators)
Conflicts <- read.csv("Worldconflicts2018-2021.csv")
str(Conflicts)
ConflictsData <- Conflicts %>% mutate(Gactor1 = case_when(inter1 == 1 ~ "Government or mutinous force",
                                         inter1 == 2 ~ "Rebel force",
                                         inter1 == 3 ~ "Political militia",
                                         inter1 == 4 ~ "Ethnic militia",
                                         inter1 == 5 ~ "Rioters",
                                         inter1 == 6 ~ "Protesters",
                                         inter1 == 7 ~ "Civilians",
                                         inter1 == 8 ~ "Outside/external force"),
                     Gactor2 = case_when(inter2 == 1 ~ "Government or mutinous force",
                                         inter2 == 2 ~ "Rebel force",
                                         inter2 == 3 ~ "Political militia",
                                         inter2 == 4 ~ "Ethnic militia",
                                         inter2 == 5 ~ "Rioters",
                                         inter2 == 6 ~ "Protesters",
                                         inter2 == 7 ~ "Civilians",
                                         inter2 == 8 ~ "Outside/external force"),
                     actor2 = case_when(actor2 == "" ~ "Single actor event",
                                        TRUE ~ actor2),
                     Gactor2 = case_when(Gactor2 == "" ~ "Single actor event",
                                        TRUE ~ Gactor2)) 

ConflictsData <- ConflictsData %>% 
  select(year, event_date, event_type, sub_event_type, actor1, assoc_actor_1, Gactor1, actor2, assoc_actor_2, Gactor2, 
         region, country, iso3, admin1, admin2, latitude, longitude, fatalities) 
str(ConflictsData)

SummaryConflicts <- ConflictsData %>% group_by(year, region, iso3, country) %>% 
  summarise(Conflicts = n(),
            Fatalities = sum(fatalities, na.rm = TRUE)) %>% 
  ungroup()

# For parallel coordinates
ParallelCoordinatesVis <- SummaryConflicts %>% 
  left_join(Indicators, by = c("iso3"="Country.Code", "year"="Time")) %>% 
  arrange(region, country, year) %>% 
  mutate(FatalitiesName = Fatalities,
         ConflictsName = Conflicts,
         Fatalities = ifelse(Fatalities > 1000, 1000, Fatalities),
         Conflicts = ifelse(Conflicts > 2500, 2500, Conflicts)) %>% 
  select(year, region, country, FatalitiesName, ConflictsName, Fatalities, Conflicts, `Control of Corruption`, `Government Effectiveness`, `Political Stability and Absence of Violence/Terrorism`, 
         `Regulatory Quality`, `Rule of Law`) %>% filter(!is.na("Control of Corruption")) #%>% 
  #mutate(country = as.numeric(factor(country)),
  #       region = as.numeric(factor(region)))
write.csv(ParallelCoordinatesVis, file = "ParallelCoordinatesVisCat.csv", na = "")


### For arc diagram
library(jsonlite)
ToJsonData <- ConflictsData %>%  filter(year == 2020 & country == "Afghanistan") %>% 
  group_by(Gactor1, Gactor2, actor1, actor2) %>% 
  summarise(Conflicts = n()) %>% ungroup()

links = ToJsonData %>% select(actor1, actor2, Conflicts) %>% 
  rename(source=actor1, target = actor2, value = Conflicts) %>% 
  toJSON()
validate(links)

ids = data.frame(id = unique(c(unique(ToJsonData$actor1), unique(ToJsonData$actor2))))
nodes = ids %>% left_join(unique(ToJsonData[,c("actor2", "Gactor2")]), by = c("id"="actor2")) %>% 
  left_join(unique(ToJsonData[,c("actor1", "Gactor1")]), by = c("id"="actor1")) %>% 
  mutate(group = as.numeric(factor(case_when(!is.na(Gactor1) & !is.na(Gactor2) ~ Gactor1,
                                             !is.na(Gactor1) & is.na(Gactor2) ~ Gactor1,
                                             !is.na(Gactor2) & is.na(Gactor1) ~ Gactor2,
                                             id == "Single actor event" ~ "Single actor")))) %>% 
  select(id, group) %>% 
  toJSON()
validate(nodes)

ToJsonData2 <- paste0('{"nodes":', nodes, ',"links":', links, '}' )
validate(ToJsonData2)
write(prettify(ToJsonData2), file = "ArcDiagram_AFG.json")


### For sunburst

print_json_lines <- function(json, lines) {
  json_lines <- strsplit(json, "\n")[[1]]
  json_lines <- json_lines[lines]
  cat(paste(json_lines, collapse = "\n"))
  invisible(json_lines)
}

ToJsonData <- ConflictsData %>% 
  arrange(country, event_date) %>% 
  mutate(event_month = lubridate::month(lubridate::dmy(event_date))) %>% 
  select(year,  event_type, sub_event_type, country, fatalities) %>% 
  group_by(year, event_type, sub_event_type, country) %>% 
  summarise(fatalities = sum(fatalities)) %>% ungroup() 

ToJsonData %>% arrange(year, event_type, sub_event_type, country)


conflicts <- ToJsonData %>% 
  select(year, event_type, sub_event_type, country, fatalities) %>%
  group_by(year, event_type, sub_event_type) %>%
  tidyr::nest() %>%
  rename(name = sub_event_type, 
    children = data) %>%
  group_by(year, event_type) %>% 
  tidyr::nest() %>% 
  rename(name = event_type, 
    children = data) %>% 
  group_by(year) %>% 
  tidyr::nest() %>% 
  # rename(name = event_month, children = data) %>% 
  # group_by(year) %>% 
  # tidyr::nest() %>% 
  rename(name = year, 
    children = data) %>% 
  mutate(conf = "Conflicts") %>% 
  group_by(conf) %>% 
  tidyr::nest() %>% 
  rename(name = conf, children = data)


data <- jsonlite::toJSON(conflicts, pretty = TRUE)
print_json_lines(jsonlite::toJSON(conflicts, pretty = TRUE), 1:30)

validate(data)
write(prettify(data), file = "Sunburst.json")


### For zoom sunburst


print_json_lines <- function(json, lines) {
  json_lines <- strsplit(json, "\n")[[1]]
  json_lines <- json_lines[lines]
  cat(paste(json_lines, collapse = "\n"))
  invisible(json_lines)
}

ToJsonData3 <- ConflictsData %>% 
  mutate(event_month = lubridate::month(lubridate::dmy(event_date))) %>% 
  select(event_type, sub_event_type, region, country, admin1) %>% 
  group_by(event_type, sub_event_type, region, country, admin1) %>% 
  count(name = "value") %>% ungroup()

ToJsonData3 %>% arrange(event_type, sub_event_type, region, country, admin1)


conflicts3 <- ToJsonData3 %>% 
  group_by(event_type, sub_event_type, region, country) %>%
  rename(name = admin1) %>% 
  tidyr::nest() %>%
  rename(name = country, 
         children = data) %>%
  group_by(event_type, sub_event_type, region) %>% 
  tidyr::nest() %>% 
  rename(name = region, 
         children = data) %>% 
  group_by(event_type, sub_event_type) %>% 
  tidyr::nest() %>% 
  rename(name = sub_event_type, 
         children = data) %>% 
  group_by(event_type) %>% 
  tidyr::nest() %>% 
  rename(name = event_type, 
         children = data) %>% 
  mutate(conf = "Conflicts") %>% 
  group_by(conf) %>% 
  tidyr::nest() %>% 
  rename(name = conf, children = data)


data3 <- jsonlite::toJSON(conflicts3, pretty = TRUE)
print_json_lines(jsonlite::toJSON(conflicts3, pretty = TRUE), 1:30)

validate(data3)
write(prettify(data3), file = "ZoomSunburst1.json")

ToJsonData4 <- ConflictsData %>% 
  mutate(event_month = lubridate::month(lubridate::dmy(event_date))) %>% 
  select(year, event_month, event_type) %>% 
  group_by(year,event_month, event_type) %>% 
  count(name = "value") %>% ungroup()

ToJsonData4 %>% arrange(year,event_month, event_type)


conflicts4 <- ToJsonData4 %>%
  mutate(year = as.character(year),
         event_month = as.character(event_month)) %>% 
  group_by(year, event_month) %>%
  rename(name = event_type) %>% 
  tidyr::nest() %>%
  rename(name = event_month, 
         children = data) %>% 
  group_by(year) %>% 
  tidyr::nest() %>% 
  rename(name = year, 
         children = data) %>% 
  # group_by(event_type) %>% 
  # tidyr::nest() %>% 
  # rename(name = event_type, 
  #        children = data) %>% 
  mutate(conf = "Conflicts") %>% 
  group_by(conf) %>% 
  tidyr::nest() %>% 
  rename(name = conf, children = data)


data4 <- jsonlite::toJSON(conflicts4, pretty = TRUE)
print_json_lines(jsonlite::toJSON(conflicts4, pretty = TRUE), 1:30)

validate(data4)
write(prettify(data4), file = "ZoomSunburst2.json")

# For hierarchical chord diagram
ToJsonData5 <- ConflictsData %>% filter(year == 2020) %>% 
  select(country, Gactor1, Gactor2) %>% 
  mutate(Gactor2 = ifelse(is.na(Gactor2), "Single actor", Gactor2), 
         name = paste0(paste0(paste0("Conflicts.", Gactor1),"."),gsub("\\.","",gsub(",","",gsub(" ","",country)))), 
         Gactor2 = paste0(paste0(paste0("Conflicts.", Gactor2),"."),gsub("\\.","",gsub(",","",gsub(" ","",country))))) %>% 
  group_by(name, Gactor2) %>% 
  summarise(size = n()) %>% 
  group_by(name) %>% 
  summarise(size = sum(size),
    imports = list(Gactor2)) %>% 
  ungroup() %>% 
  select(name, size, imports)
  

data5 <- jsonlite::toJSON(ToJsonData5, pretty = TRUE)
print_json_lines(jsonlite::toJSON(ToJsonData5, pretty = TRUE), 1:30)


validate(data5)
write(prettify(data5), file = "DependencyDiagram2.json")

#for bubble
ToJsonData6 <- ConflictsData %>% 
  select(event_type, sub_event_type, region) %>% 
  group_by(event_type, sub_event_type, region) %>% 
  count(name = "size") %>% ungroup()

ToJsonData3 %>% arrange(event_type, sub_event_type, region)
ToJsonData3 %>% arrange(event_type, region, country)


conflicts6 <- ToJsonData6 %>% 
  group_by(event_type, sub_event_type) %>%
  rename(name = region) %>% 
  tidyr::nest() %>%
  rename(name = sub_event_type, 
         children = data) %>%
  group_by(event_type) %>% 
  tidyr::nest() %>% 
  rename(name = event_type, 
         children = data) %>% 
  mutate(conf = "Conflicts") %>% 
  group_by(conf) %>% 
  tidyr::nest() %>% 
  rename(name = conf, children = data)


data6 <- jsonlite::toJSON(conflicts6, pretty = TRUE)
print_json_lines(jsonlite::toJSON(conflicts6, pretty = TRUE), 1:30)

validate(data6)
write(prettify(data6), file = "Bubble1.json")

ToJsonData7 <- ConflictsData %>% 
   group_by(event_type, region, country) %>% 
  count(name = "size") %>% ungroup()

conflicts7 <- ToJsonData7 %>% 
  group_by(event_type, region) %>%
  rename(name = country) %>% 
  tidyr::nest() %>%
  rename(name = region, 
         children = data) %>%
  group_by(event_type) %>% 
  tidyr::nest() %>% 
  rename(name = event_type, 
         children = data) %>% 
  mutate(conf = "Conflicts") %>% 
  group_by(conf) %>% 
  tidyr::nest() %>% 
  rename(name = conf, children = data)


data7 <- jsonlite::toJSON(conflicts7, pretty = TRUE)
print_json_lines(jsonlite::toJSON(conflicts7, pretty = TRUE), 1:30)

validate(data7)
write(prettify(data7), file = "Bubble2.json")

#For map
map <- ConflictsData %>% 
  select(country,latitude ,longitude) %>% unique()

data8 <- jsonlite::toJSON(map, pretty = TRUE)
print_json_lines(jsonlite::toJSON(map, pretty = TRUE), 1:30)

validate(data8)
write(prettify(data8), file = "Map.json")

#For spider
spider <- ConflictsData %>% filter(year == 2020) %>% 
  group_by(event_type) %>% 
  summarise(conflicts = n(),
            fatalities = sum(fatalities),
            ncountries = n_distinct(country)) %>% 
  mutate(conflicts = conflicts / sum(conflicts),
         fatalities = fatalities / sum(fatalities),
         ncountries = ncountries / sum(ncountries)) %>% 
  rename(axis = event_type) %>% 
  reshape2::melt(id = "axis") %>% group_by(variable) %>% 
  tidyr::nest() %>% ungroup() %>% select(-variable) 

data9 <- jsonlite::toJSON(spider, pretty = TRUE)
print_json_lines(jsonlite::toJSON(spider, pretty = TRUE), 1:30)

validate(data9)
write(prettify(data9), file = "Spider1.json")

spider2 <- ConflictsData %>% filter(year == 2020) %>% 
  group_by(event_type, region) %>% 
  summarise(value = sum(fatalities))  %>% 
  mutate(value = value / sum(value)) %>%
  rename(axis = event_type) %>% 
  group_by(region) %>% 
  tidyr::nest() %>% ungroup() %>% select(-region) 

data10 <- jsonlite::toJSON(spider2, pretty = TRUE)
print_json_lines(jsonlite::toJSON(spider2, pretty = TRUE), 1:30)

validate(data10)
write(prettify(data10), file = "Spider2.json")

library(tidyverse)
library(viridis)
library(patchwork)
library(hrbrthemes)
library(circlize)
library(chorddiag)  #devtools::install_github("mattflor/chorddiag")

# Load dataset from github
data <- read.table("https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/13_AdjacencyDirectedWeighted.csv", header=TRUE)

# short names
colnames(data) <- c("Africa", "East Asia", "Europe", "Latin Ame.",   "North Ame.",   "Oceania", "South Asia", "South East Asia", "Soviet Union", "West.Asia")
rownames(data) <- colnames(data)

# I need a long format
data_long <- data %>%
  rownames_to_column %>%
  gather(key = 'key', value = 'value', -rowname)

# parameters
circos.clear()
circos.par(start.degree = 90, gap.degree = 4, track.margin = c(-0.1, 0.1), points.overflow.warning = FALSE)
par(mar = rep(0, 4))

# color palette
mycolor <- viridis(10, alpha = 1, begin = 0, end = 1, option = "D")
mycolor <- mycolor[sample(1:10)]

# Base plot
chordDiagram(
  x = data_long, 
  grid.col = mycolor,
  transparency = 0.25,
  directional = 1,
  direction.type = c("arrows", "diffHeight"), 
  diffHeight  = -0.04,
  annotationTrack = "grid", 
  annotationTrackHeight = c(0.05, 0.1),
  link.arr.type = "big.arrow", 
  link.sort = TRUE, 
  link.largest.ontop = TRUE)

# Add text and axis
circos.trackPlotRegion(
  track.index = 1, 
  bg.border = NA, 
  panel.fun = function(x, y) {
    
    xlim = get.cell.meta.data("xlim")
    sector.index = get.cell.meta.data("sector.index")
    
    # Add names to the sector. 
    circos.text(
      x = mean(xlim), 
      y = 3.2, 
      labels = sector.index, 
      facing = "bending", 
      cex = 0.8
    )
    
    # Add graduation on axis
    circos.axis(
      h = "top", 
      major.at = seq(from = 0, to = xlim[2], by = ifelse(test = xlim[2]>10, yes = 2, no = 1)), 
      minor.ticks = 1, 
      major.tick.percentage = 0.5,
      labels.niceFacing = FALSE)
  }
)


# Load dataset from github
data <- read.table("https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/13_AdjacencyDirectedWeighted.csv", header=TRUE)
# Package
library(networkD3)

# I need a long format
data_long <- data %>%
  rownames_to_column %>%
  gather(key = 'key', value = 'value', -rowname) %>%
  filter(value > 0)
colnames(data_long) <- c("source", "target", "value")
data_long$target <- paste(data_long$target, " ", sep="")

# From these flows we need to create a node data frame: it lists every entities involved in the flow
nodes <- data.frame(name=c(as.character(data_long$source), as.character(data_long$target)) %>% unique())

# With networkD3, connection must be provided using id, not using real name like in the links dataframe.. So we need to reformat it.
data_long$IDsource=match(data_long$source, nodes$name)-1 
data_long$IDtarget=match(data_long$target, nodes$name)-1

# prepare colour scale
ColourScal ='d3.scaleOrdinal() .range(["#FDE725FF","#B4DE2CFF","#6DCD59FF","#35B779FF","#1F9E89FF","#26828EFF","#31688EFF","#3E4A89FF","#482878FF","#440154FF"])'

# Make the Network
sankeyNetwork(Links = data_long, Nodes = nodes,
              Source = "IDsource", Target = "IDtarget",
              Value = "value", NodeID = "name", 
              sinksRight=FALSE, colourScale=ColourScal, nodeWidth=40, fontSize=13, nodePadding=20)
